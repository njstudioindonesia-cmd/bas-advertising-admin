import { supabaseAdmin } from "@/lib/supabase/admin";
import { PaymentRecord, ManualPaymentAccount, PaymentStatus } from "./types";
import { transitionOrderStatus } from "../orders/service";
import { publishEvent } from "@/lib/events";
import { logAudit } from "@/lib/db/queries/audit";
import { markInvoicePaid } from "../invoices";
import { notifyPaymentVerified } from "../notifications";

/**
 * In-memory fallback cache untuk payments jika Supabase cloud belum termigrasi
 */
const fallbackPayments = new Map<string, PaymentRecord>();

export const DEFAULT_PAYMENT_ACCOUNTS: ManualPaymentAccount[] = [
  {
    id: "nagari",
    bank: "Bank Nagari (BPD Sumatera Barat)",
    accountNumber: "2100021088921",
    accountName: "BAS Advertising / Cetak.inc Padang",
    badge: "Prioritas Lokal Sumbar",
    instructions: [
      "Transfer via ATM Bank Nagari, Nagari Mobile Banking, atau transfer antar bank (Kode Bank 011).",
      "Masukkan nominal tepat hingga 3 digit kode unik.",
      "Unggah bukti transfer Anda setelah transaksi berhasil.",
    ],
  },
  {
    id: "bca",
    bank: "BCA (Bank Central Asia)",
    accountNumber: "0321948291",
    accountName: "BAS Advertising / Cetak.inc",
    badge: "Transfer Instan",
    instructions: [
      "Transfer sesuai total nominal hingga 3 digit kode unik terakhir.",
      "Simpan dan unggah bukti transfer/screenshot m-BCA Anda.",
      "Admin Urang Dalam akan memverifikasi pesanan Anda dalam 5-15 menit.",
    ],
  },
  {
    id: "mandiri",
    bank: "Bank Mandiri",
    accountNumber: "1110018274621",
    accountName: "BAS Advertising / Cetak.inc",
    badge: "Livin by Mandiri",
    instructions: [
      "Transfer antar bank atau via Livin by Mandiri (Kode Bank 008).",
      "Pastikan nama penerima BAS Advertising / Cetak.inc.",
    ],
  },
  {
    id: "bri",
    bank: "Bank BRI",
    accountNumber: "005801002948530",
    accountName: "BAS Advertising Padang",
    badge: "BRImo / ATM",
    instructions: [
      "Transfer via BRImo atau ATM BRI terdekat (Kode Bank 002).",
      "Foto resi struk ATM atau screenshot bukti transfer.",
    ],
  },
  {
    id: "qris",
    bank: "QRIS Cetak.inc (Semua E-Wallet & M-Banking)",
    accountNumber: "NMID: ID1020039281729",
    accountName: "Cetak.inc BAS Advertising",
    badge: "Scan QR Bebas Biaya",
    qrisUrl: "/images/qris-cetakinc.svg",
    instructions: [
      "Buka aplikasi GoPay, OVO, Dana, ShopeePay, BCA Mobile, atau Livin.",
      "Scan QRIS yang tampil di layar dan masukkan nominal sesuai total tagihan.",
      "Simpan bukti pembayaran dan unggah formulir konfirmasi.",
    ],
  },
];

/**
 * Menghasilkan kode unik 3 digit (100 - 999) untuk memudahkan rekonsiliasi mutasi bank
 */
export function generateUniqueCode(): number {
  return Math.floor(100 + Math.random() * 899);
}

export async function submitPaymentProof(input: {
  orderId: string;
  orderCode?: string;
  customerName?: string;
  customerPhone?: string;
  amount: number;
  proofUrl: string;
  senderBank?: string;
  senderName?: string;
  notes?: string;
}): Promise<{ success: boolean; paymentId?: string; error?: string }> {
  const paymentId = "pay-" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  const now = new Date().toISOString();

  const record: PaymentRecord = {
    id: paymentId,
    orderId: input.orderId,
    orderCode: input.orderCode,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    amount: input.amount,
    proofUrl: input.proofUrl,
    status: "PENDING",
    senderBank: input.senderBank || null,
    senderName: input.senderName || null,
    notes: input.notes || null,
    createdAt: now,
  };

  try {
    const { data, error } = await supabaseAdmin
      .from("payments")
      .insert({
        id: paymentId,
        order_id: input.orderId,
        amount: input.amount,
        proof_url: input.proofUrl,
        status: "PENDING",
      })
      .select("id")
      .maybeSingle();

    if (error) {
      console.warn("[PAYMENTS] Gagal menyimpan ke DB payments, menggunakan fallback in-memory:", error.message);
    }
  } catch (err: any) {
    console.warn("[PAYMENTS] Exception saat insert payment:", err.message);
  }

  // Simpan ke memory fallback
  fallbackPayments.set(paymentId, record);
  fallbackPayments.set(input.orderId, record);

  // Update order status menjadi MENUNGGU_VERIFIKASI
  try {
    await transitionOrderStatus(input.orderId, "MENUNGGU_VERIFIKASI", {
      id: "customer",
      role: "customer",
      username: input.customerName || "customer",
    });
  } catch (err) {
    console.warn("[PAYMENTS] Gagal transisi status pesanan:", err);
  }

  return { success: true, paymentId };
}

export async function getPayments(options?: {
  status?: PaymentStatus;
  limit?: number;
}): Promise<PaymentRecord[]> {
  try {
    let query = supabaseAdmin
      .from("payments")
      .select("*, orders(code, customer_name, customer_phone, subtotal, delivery_fee)")
      .order("created_at", { ascending: false });

    if (options?.status) {
      query = query.eq("status", options.status);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data.map((p: any) => ({
        id: p.id,
        orderId: p.order_id,
        orderCode: p.orders?.code || p.order_id,
        customerName: p.orders?.customer_name,
        customerPhone: p.orders?.customer_phone,
        amount: Number(p.amount || 0),
        proofUrl: p.proof_url,
        status: p.status as PaymentStatus,
        verifiedBy: p.verified_by,
        verifiedAt: p.verified_at,
        rejectReason: p.reject_reason,
        createdAt: p.created_at,
      }));
    }
  } catch (err) {
    console.warn("[PAYMENTS] Gagal membaca dari database:", err);
  }

  // Fallback to in-memory store
  const all = Array.from(fallbackPayments.values());
  if (options?.status) {
    return all.filter((p) => p.status === options.status);
  }
  return all;
}

export async function getPaymentByOrder(orderId: string): Promise<PaymentRecord | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return {
        id: data.id,
        orderId: data.order_id,
        amount: Number(data.amount || 0),
        proofUrl: data.proof_url,
        status: data.status as PaymentStatus,
        verifiedBy: data.verified_by,
        verifiedAt: data.verified_at,
        rejectReason: data.reject_reason,
        createdAt: data.created_at,
      };
    }
  } catch {}

  return fallbackPayments.get(orderId) || null;
}

export async function verifyPayment(
  paymentId: string,
  orderId: string,
  adminUser: { id: string; username: string }
): Promise<{ success: boolean; error?: string }> {
  const now = new Date().toISOString();

  try {
    // 1. Update status pembayaran menjadi VERIFIED
    await supabaseAdmin
      .from("payments")
      .update({
        status: "VERIFIED",
        verified_by: adminUser.username,
        verified_at: now,
      })
      .eq("id", paymentId);

    // Update fallback memory
    const existing = fallbackPayments.get(paymentId);
    if (existing) {
      existing.status = "VERIFIED";
      existing.verifiedBy = adminUser.username;
      existing.verifiedAt = now;
      fallbackPayments.set(paymentId, existing);
      fallbackPayments.set(orderId, existing);
    }

    // 2. Transisi status pesanan menjadi DIBAYAR
    const res = await transitionOrderStatus(orderId, "DIBAYAR", {
      id: adminUser.id,
      role: "admin",
      username: adminUser.username,
    });

    if (!res.success) {
      return { success: false, error: res.error };
    }

    // 3. Update status invoice menjadi LUNAS
    await markInvoicePaid(orderId);

    // 4. Emit event outbox
    await publishEvent("ORDER_PAID", {
      aggregateType: "order",
      aggregateId: orderId,
      paymentId,
      verifiedBy: adminUser.username,
      verifiedAt: now,
    });

    // 5. Catat audit log
    logAudit({
      actor: `admin:${adminUser.username}`,
      action: "VERIFY_PAYMENT",
      entity: "payments",
      entityId: paymentId,
      diff: { orderId, status: "VERIFIED" },
    });

    // 6. Notifikasi WhatsApp Otomatis ke Pelanggan (Non-blocking)
    const paidOrder = res.order;
    if (paidOrder && paidOrder.customerPhone) {
      notifyPaymentVerified({
        phone: paidOrder.customerPhone,
        customerName: paidOrder.customerName,
        orderCode: paidOrder.code,
      }).catch((e) => console.warn("[PAYMENTS] WA trigger failed:", e));
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal memverifikasi pembayaran" };
  }
}

export async function rejectPayment(
  paymentId: string,
  orderId: string,
  reason: string,
  adminUser: { id: string; username: string }
): Promise<{ success: boolean; error?: string }> {
  const now = new Date().toISOString();

  try {
    await supabaseAdmin
      .from("payments")
      .update({
        status: "REJECTED",
        verified_by: adminUser.username,
        verified_at: now,
        reject_reason: reason,
      })
      .eq("id", paymentId);

    const existing = fallbackPayments.get(paymentId);
    if (existing) {
      existing.status = "REJECTED";
      existing.verifiedBy = adminUser.username;
      existing.verifiedAt = now;
      existing.rejectReason = reason;
      fallbackPayments.set(paymentId, existing);
      fallbackPayments.set(orderId, existing);
    }

    await transitionOrderStatus(orderId, "PEMBAYARAN_DITOLAK", {
      id: adminUser.id,
      role: "admin",
      username: adminUser.username,
    });

    logAudit({
      actor: `admin:${adminUser.username}`,
      action: "REJECT_PAYMENT",
      entity: "payments",
      entityId: paymentId,
      diff: { orderId, reason, status: "REJECTED" },
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal menolak pembayaran" };
  }
}
