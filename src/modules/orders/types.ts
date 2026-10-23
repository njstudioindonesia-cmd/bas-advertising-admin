import { UserRole } from "../auth/types";
import { EventType } from "@/lib/events/types";

export type OrderStatus =
  | "DRAFT"
  | "MENUNGGU_PEMBAYARAN"
  | "MENUNGGU_VERIFIKASI"
  | "DIBAYAR"
  | "MENUNGGU_PENUGASAN_ADMIN"
  | "DITERIMA_VENDOR"
  | "DIPRODUKSI"
  | "SIAP_ANTAR"
  | "KURIR_MENJEMPUT"
  | "DALAM_PERJALANAN"
  | "TIBA"
  | "SELESAI"
  | "DIBATALKAN"
  | "KEDALUWARSA"
  | "DITOLAK_VENDOR"
  | "PEMBAYARAN_DITOLAK"
  // Legacy status support
  | "BARU"
  | "DIPROSES"
  | "SIAP"
  | "DIKIRIM";

export interface StateTransitionRule {
  from: OrderStatus[];
  to: OrderStatus;
  allowedRoles: UserRole[];
  emitEvent?: EventType;
  description: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string | null;
  productName: string;
  price: number;
  qty: number;
  subtotal: number;
  designNote?: string | null;
}

export interface Order {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  deliveryMethod: string;
  address?: string | null;
  destLat?: number | null;
  destLng?: number | null;
  destAddress?: string | null;
  destNote?: string | null;
  deliveryFee?: number;
  paymentMethod: string;
  paymentStatus?: "UNPAID" | "VERIFYING" | "PAID" | "REJECTED";
  uniqueCode?: number;
  hubId?: string | null;
  note?: string | null;
  subtotal: number;
  status: OrderStatus;
  items?: OrderItem[];
  idempotencyKey?: string | null;
  createdAt: string;
  updatedAt?: string;
}
