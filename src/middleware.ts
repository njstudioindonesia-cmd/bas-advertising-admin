import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Alias redirects
  if (pathname === "/admin" || pathname === "/admin/") {
    return NextResponse.redirect(new URL("/", request.url), 307);
  }

  // 2. Token Auth Check
  const token =
    request.cookies.get("cetak_auth_token")?.value ||
    request.cookies.get("bas_admin_token")?.value;

  let userRole: "customer" | "admin" | "vendor" | "driver" | null = null;

  if (token && typeof token === "string" && token.includes(".")) {
    try {
      const [b64] = token.split(".");
      const binaryStr = atob(b64.replace(/-/g, "+").replace(/_/g, "/"));

      if (binaryStr.includes("|")) {
        const [, , role, , expiresAtStr] = binaryStr.split("|");
        const exp = Number(expiresAtStr);
        if (!Number.isNaN(exp) && Date.now() < exp) {
          userRole = role as any;
        }
      } else if (binaryStr.includes(":")) {
        const [, , expiresAtStr] = binaryStr.split(":");
        const exp = Number(expiresAtStr);
        if (!Number.isNaN(exp) && Date.now() < exp) {
          userRole = "admin";
        }
      }
    } catch {
      userRole = null;
    }
  }

  // Proteksi Portal Vendor (/vendor/*)
  if (pathname.startsWith("/vendor") && pathname !== "/vendor/login") {
    if (!userRole || (userRole !== "vendor" && userRole !== "admin")) {
      const loginUrl = new URL("/vendor/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Proteksi Portal Driver (/driver/*)
  if (pathname.startsWith("/driver") && pathname !== "/driver/login") {
    if (!userRole || (userRole !== "driver" && userRole !== "admin")) {
      const loginUrl = new URL("/driver/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Tambahkan Security Headers standar industri
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Permissions-Policy", "camera=(self), microphone=(), geolocation=(self)");

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/vendor/:path*",
    "/driver/:path*",
    "/((?!_next/static|_next/image|favicon.ico|uploads/).*)",
  ],
};
