import crypto from "node:crypto";
import { UserRole, TokenPayload, SessionUser } from "./types";

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 hari

function getSecretKey(): string {
  return (
    process.env.SESSION_SECRET ||
    process.env.ADMIN_JWT_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "cetak_inc_multi_role_auth_secret_padang_2026_super_key"
  );
}

/**
 * Membuat token bertanda tangan HMAC sha256 (URL-Safe Base64)
 */
export function createRoleToken(user: {
  id: string;
  username: string;
  role: UserRole;
  hubId?: string | null;
}): string {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  // Format: userId|username|role|hubId|expiresAt
  const hubPart = user.hubId || "";
  const payloadStr = `${user.id}|${user.username}|${user.role}|${hubPart}|${expiresAt}`;

  const hmac = crypto.createHmac("sha256", getSecretKey()).update(payloadStr).digest("hex");
  const base64Payload = Buffer.from(payloadStr, "utf-8").toString("base64url");
  return `${base64Payload}.${hmac}`;
}

/**
 * Memverifikasi token bertanda tangan, mendukung format baru (5 bagian) dan legacy (3 bagian)
 */
export function verifyRoleToken(token: string): { valid: boolean; user?: SessionUser } {
  try {
    if (!token || typeof token !== "string") return { valid: false };

    const parts = token.split(".");
    if (parts.length !== 2) return { valid: false };

    const [base64Payload, signature] = parts;
    const payloadStr = Buffer.from(base64Payload, "base64url").toString("utf-8");

    // 1. Cek format baru dengan delimiter '|'
    if (payloadStr.includes("|")) {
      const [userId, username, roleStr, hubIdPart, expiresAtStr] = payloadStr.split("|");
      if (!userId || !expiresAtStr) return { valid: false };

      const expiresAt = Number(expiresAtStr);
      if (Number.isNaN(expiresAt) || Date.now() > expiresAt) return { valid: false };

      const expectedHmac = crypto.createHmac("sha256", getSecretKey()).update(payloadStr).digest("hex");
      if (signature.length !== expectedHmac.length) return { valid: false };
      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedHmac))) {
        return { valid: false };
      }

      const role: UserRole = (["customer", "admin", "vendor", "driver"].includes(roleStr)
        ? roleStr
        : "customer") as UserRole;

      return {
        valid: true,
        user: {
          id: userId,
          username,
          role,
          hubId: hubIdPart || null,
        },
      };
    }

    // 2. Fallback backward-compatible: format lama delimiter ':' (userId:username:expiresAt)
    if (payloadStr.includes(":")) {
      const [userId, username, expiresAtStr] = payloadStr.split(":");
      if (!userId || !expiresAtStr) return { valid: false };

      const expiresAt = Number(expiresAtStr);
      if (Number.isNaN(expiresAt) || Date.now() > expiresAt) return { valid: false };

      const expectedHmac = crypto.createHmac("sha256", getSecretKey()).update(payloadStr).digest("hex");
      if (signature.length !== expectedHmac.length) return { valid: false };
      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedHmac))) {
        return { valid: false };
      }

      return {
        valid: true,
        user: {
          id: userId,
          username: username || "admin",
          role: "admin", // Token legacy diasumsikan admin
          hubId: null,
        },
      };
    }

    return { valid: false };
  } catch {
    return { valid: false };
  }
}
