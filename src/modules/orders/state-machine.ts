import { OrderStatus, StateTransitionRule } from "./types";
import { UserRole } from "../auth/types";
import { publishEvent } from "@/lib/events";

export const ORDER_TRANSITIONS: StateTransitionRule[] = [
  // 1. Checkout selesai -> Menunggu Pembayaran
  {
    from: ["DRAFT", "BARU"],
    to: "MENUNGGU_PEMBAYARAN",
    allowedRoles: ["customer", "admin"],
    emitEvent: "ORDER_CREATED",
    description: "Pesanan dibuat, menunggu pembayaran pelanggan",
  },
  // 2. Pelanggan upload bukti bayar -> Menunggu Verifikasi
  {
    from: ["MENUNGGU_PEMBAYARAN", "BARU"],
    to: "MENUNGGU_VERIFIKASI",
    allowedRoles: ["customer", "admin"],
    description: "Pelanggan telah mengunggah bukti bayar, menunggu dicek admin",
  },
  // 3. Admin verifikasi pembayaran -> Dibayar
  {
    from: ["MENUNGGU_VERIFIKASI", "MENUNGGU_PEMBAYARAN", "BARU"],
    to: "DIBAYAR",
    allowedRoles: ["admin"],
    emitEvent: "ORDER_PAID",
    description: "Pembayaran terverifikasi lunas oleh admin Urang Dalam",
  },
  // 3b. Admin tolak pembayaran
  {
    from: ["MENUNGGU_VERIFIKASI"],
    to: "PEMBAYARAN_DITOLAK",
    allowedRoles: ["admin"],
    emitEvent: "ORDER_PAYMENT_REJECTED",
    description: "Bukti bayar ditolak oleh admin (rekening/nominal tidak cocok)",
  },
  // 4. Auto-routing gagal -> Menunggu Penugasan Admin
  {
    from: ["DIBAYAR"],
    to: "MENUNGGU_PENUGASAN_ADMIN",
    allowedRoles: ["admin"],
    description: "Pesanan memerlukan pemilihan Hub manual oleh admin",
  },
  // 5. Vendor menerima pesanan
  {
    from: ["DIBAYAR", "MENUNGGU_PENUGASAN_ADMIN", "BARU", "DIPROSES"],
    to: "DITERIMA_VENDOR",
    allowedRoles: ["vendor", "admin"],
    emitEvent: "ORDER_ACCEPTED_VENDOR",
    description: "Workshop/Vendor menerima pesanan cetak",
  },
  // 5b. Vendor menolak pesanan
  {
    from: ["DIBAYAR", "DITERIMA_VENDOR"],
    to: "DITOLAK_VENDOR",
    allowedRoles: ["vendor", "admin"],
    description: "Vendor menolak pesanan (kapasitas penuh / mesin antre)",
  },
  // 6. Vendor mulai mencetak
  {
    from: ["DITERIMA_VENDOR", "DIBAYAR", "DIPROSES"],
    to: "DIPRODUKSI",
    allowedRoles: ["vendor", "admin"],
    emitEvent: "ORDER_IN_PRODUCTION",
    description: "Pesanan masuk proses cetak / produksi",
  },
  // 7. Cetakan selesai -> Siap Antar
  {
    from: ["DIPRODUKSI", "DIPROSES", "SIAP"],
    to: "SIAP_ANTAR",
    allowedRoles: ["vendor", "admin"],
    emitEvent: "ORDER_READY_FOR_DELIVERY",
    description: "Pesanan selesai diproduksi & dikemas, siap diantar",
  },
  // 8. Driver menjemput pesanan di Hub
  {
    from: ["SIAP_ANTAR", "SIAP", "DIKIRIM"],
    to: "KURIR_MENJEMPUT",
    allowedRoles: ["driver", "admin"],
    emitEvent: "DRIVER_PICKED_UP",
    description: "Kurir sedang mengambil pesanan di workshop hub",
  },
  // 9. Driver dalam perjalanan ke alamat pelanggan
  {
    from: ["KURIR_MENJEMPUT", "SIAP_ANTAR", "DIKIRIM"],
    to: "DALAM_PERJALANAN",
    allowedRoles: ["driver", "admin"],
    emitEvent: "DRIVER_IN_TRANSIT",
    description: "Kurir sedang dalam perjalanan menuju lokasi pelanggan",
  },
  // 10. Driver tiba di lokasi
  {
    from: ["DALAM_PERJALANAN", "DIKIRIM"],
    to: "TIBA",
    allowedRoles: ["driver", "admin"],
    emitEvent: "DRIVER_ARRIVED",
    description: "Kurir telah tiba di alamat pengiriman pelanggan",
  },
  // 11. Serah terima selesai
  {
    from: ["TIBA", "DALAM_PERJALANAN", "DIKIRIM"],
    to: "SELESAI",
    allowedRoles: ["driver", "admin", "customer"],
    emitEvent: "ORDER_COMPLETED",
    description: "Pesanan telah diterima pelanggan dengan baik",
  },
  // 12. Dibatalkan
  {
    from: ["DRAFT", "MENUNGGU_PEMBAYARAN", "MENUNGGU_VERIFIKASI", "BARU"],
    to: "DIBATALKAN",
    allowedRoles: ["customer", "admin"],
    emitEvent: "ORDER_CANCELLED",
    description: "Pesanan dibatalkan",
  },
  // 13. Kedaluwarsa
  {
    from: ["MENUNGGU_PEMBAYARAN", "BARU"],
    to: "KEDALUWARSA",
    allowedRoles: ["admin"],
    emitEvent: "ORDER_EXPIRED",
    description: "Batas waktu pembayaran habis",
  },
];

/**
 * Validasi apakah transisi status diizinkan berdasarkan status awal dan role pengguna
 */
export function canTransitionOrder(
  currentStatus: OrderStatus,
  targetStatus: OrderStatus,
  userRole: UserRole
): { allowed: boolean; rule?: StateTransitionRule; error?: string } {
  // Admin selalu boleh melakukan override transisi
  if (userRole === "admin") {
    const matchedRule = ORDER_TRANSITIONS.find((r) => r.to === targetStatus);
    return { allowed: true, rule: matchedRule };
  }

  const rule = ORDER_TRANSITIONS.find(
    (r) => r.to === targetStatus && r.from.includes(currentStatus)
  );

  if (!rule) {
    return {
      allowed: false,
      error: `Transisi tidak sah dari "${currentStatus}" ke "${targetStatus}".`,
    };
  }

  if (!rule.allowedRoles.includes(userRole)) {
    return {
      allowed: false,
      error: `Peran [${userRole}] tidak memiliki izin untuk mengubah status ke "${targetStatus}".`,
    };
  }

  return { allowed: true, rule };
}

/**
 * Normalisasi status lama (BARU, DIPROSES, SIAP, DIKIRIM, SELESAI, DIBATALKAN)
 * ke status baru Blueprint V2
 */
export function normalizeOrderStatus(status: string): OrderStatus {
  const upper = (status || "").toUpperCase();
  switch (upper) {
    case "BARU":
      return "MENUNGGU_PEMBAYARAN";
    case "DIPROSES":
      return "DIPRODUKSI";
    case "SIAP":
      return "SIAP_ANTAR";
    case "DIKIRIM":
      return "DALAM_PERJALANAN";
    default:
      return (upper as OrderStatus) || "MENUNGGU_PEMBAYARAN";
  }
}
