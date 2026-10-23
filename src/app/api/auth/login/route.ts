import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authenticate } from "@/modules/auth";
import { LoginInputSchema } from "@/lib/validators";
import { checkLoginRateLimit, resetLoginRateLimit } from "@/lib/auth/rate-limit";
import { logAudit } from "@/lib/db/queries/audit";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    const body = await request.json();
    const parsed = LoginInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Input tidak valid" },
        { status: 400 }
      );
    }

    const { username, password } = parsed.data;
    const result = await authenticate(username, password);

    // Jika autentikasi sukses, izinkan masuk dan reset catatan percobaan IP
    if (result.success && result.token) {
      resetLoginRateLimit(ip);

      const cookieStore = await cookies();
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 hari
      };

      // Set cookie terpadu & cookie legacy untuk kompatibilitas penuh
      cookieStore.set("cetak_auth_token", result.token, cookieOptions);
      cookieStore.set("bas_admin_token", result.token, cookieOptions);

      logAudit({
        actor: `${result.user?.role || "user"}:${username}`,
        action: "LOGIN",
        entity: "auth",
        diff: { ip, role: result.user?.role },
      });

      return NextResponse.json({
        success: true,
        message: `Login berhasil sebagai ${result.user?.fullName || username}`,
        token: result.token,
        user: result.user || { username, role: "admin" },
      });
    }

    // Jika password salah, periksa dan catat batas percobaan rate limit
    const rateCheck = checkLoginRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Terlalu banyak percobaan login gagal. Silakan coba lagi dalam ${rateCheck.retryAfterSeconds} detik.` 
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: result.error || "Username atau password salah.",
        remainingAttempts: rateCheck.remainingAttempts 
      },
      { status: 401 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}
