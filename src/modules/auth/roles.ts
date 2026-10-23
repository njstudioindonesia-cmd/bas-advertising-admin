import { UserRole } from "./types";

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 100,
  vendor: 50,
  driver: 30,
  customer: 10,
};

export const ROLE_HOMEPAGES: Record<UserRole, string> = {
  admin: "/urang-dalam-bas-adv",
  vendor: "/vendor",
  driver: "/driver",
  customer: "/akun",
};

export const ROLE_LOGIN_PATHS: Record<UserRole, string> = {
  admin: "/urang-dalam-bas-adv",
  vendor: "/vendor/login",
  driver: "/driver/login",
  customer: "/login",
};

/**
 * Cek apakah user dengan role tertentu diizinkan mengakses path tertentu
 */
export function canAccessPath(role: UserRole | undefined, pathname: string): boolean {
  // Rute publik selalu boleh diakses
  if (
    pathname === "/" ||
    pathname.startsWith("/produk") ||
    pathname.startsWith("/keranjang") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/lacak") ||
    pathname.startsWith("/mockup") ||
    pathname.startsWith("/portofolio") ||
    pathname.startsWith("/hubungi") ||
    pathname.startsWith("/about") ||
    pathname.startsWith("/invoice") ||
    pathname.startsWith("/api/public")
  ) {
    return true;
  }

  // Admin memiliki hak akses penuh ke seluruh area
  if (role === "admin") return true;

  if (pathname.startsWith("/urang-dalam-bas-adv")) {
    return false; // Non-admin tidak boleh mengakses urang dalam
  }

  if (pathname.startsWith("/vendor")) {
    if (pathname === "/vendor/login") return true;
    return role === "vendor";
  }

  if (pathname.startsWith("/driver")) {
    if (pathname === "/driver/login") return true;
    return role === "driver";
  }

  if (pathname.startsWith("/akun")) {
    return !!role; // Boleh untuk customer, vendor, driver, admin
  }

  return true;
}
