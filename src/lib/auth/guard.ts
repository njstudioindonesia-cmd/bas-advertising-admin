import { NextResponse } from "next/server";
import { validateSession, getSessionTokenFromCookies } from "./session";

export async function requireAdmin(request?: Request): Promise<{ authorized: boolean; response?: NextResponse }> {
  let token: string | null = null;

  if (request) {
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
    if (!token) {
      const cookieHeader = request.headers.get("cookie") || "";
      const match = cookieHeader.match(/(?:cetak_auth_token|bas_admin_token)=([^;]+)/);
      if (match) {
        token = match[1];
      }
    }
  }

  if (!token) {
    token = await getSessionTokenFromCookies();
  }

  if (!token || !validateSession(token)) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: "Akses ditolak: Anda harus login sebagai Urang Dalam terlebih dahulu." },
        { status: 401 }
      ),
    };
  }

  return { authorized: true };
}
