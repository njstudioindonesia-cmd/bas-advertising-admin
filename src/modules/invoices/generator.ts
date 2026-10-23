import crypto from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { InvoiceRecord, InvoiceSnapshot } from "./types";

/**
 * In-memory fallback cache untuk memastikan invoice tetap aman dan dapat diakses
 * bahkan jika tabel belum termigrasi atau koneksi Supabase offline.
 */
const fallbackInvoices = new Map<string, InvoiceRecord>();

/**
 * Format nomor invoice resmi: INV/CTK/YYYY/MM/XXXXXX
 */
export function generateInvoiceNumber(sequenceNum?: number): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const seq = sequenceNum
    ? String(sequenceNum).padStart(6, "0")
    : Math.floor(100000 + Math.random() * 900000).toString();

  return `INV/CTK/${year}/${month}/${seq}`;
}

/**
 * Token aman acak untuk akses invoice publik tanpa login
 */
export function generatePublicToken(): string {
  return crypto.randomBytes(16).toString("hex");
}

export async function createOrGetInvoice(
  orderId: string,
  snapshot: InvoiceSnapshot
): Promise<InvoiceRecord> {
  const invoiceNo = snapshot.invoiceNo || generateInvoiceNumber();
  const publicToken = generatePublicToken();
  const now = new Date().toISOString();

  try {
    const { data: existing } = await supabaseAdmin
      .from("invoices")
      .select("*")
      .eq("order_id", orderId)
      .maybeSingle();

    if (existing) {
      const record: InvoiceRecord = {
        id: existing.id,
        invoiceNo: existing.invoice_no,
        publicToken: existing.public_token,
        orderId: existing.order_id,
        issuedAt: existing.issued_at,
        paidAt: existing.paid_at,
        snapshot: existing.snapshot as InvoiceSnapshot,
      };
      fallbackInvoices.set(record.invoiceNo, record);
      fallbackInvoices.set(orderId, record);
      return record;
    }

    const { data: created, error } = await supabaseAdmin
      .from("invoices")
      .insert({
        invoice_no: invoiceNo,
        public_token: publicToken,
        order_id: orderId,
        issued_at: now,
        paid_at: snapshot.paidAt || null,
        snapshot,
      })
      .select("*")
      .maybeSingle();

    if (!error && created) {
      const record: InvoiceRecord = {
        id: created.id,
        invoiceNo: created.invoice_no,
        publicToken: created.public_token,
        orderId: created.order_id,
        issuedAt: created.issued_at,
        paidAt: created.paid_at,
        snapshot: created.snapshot as InvoiceSnapshot,
      };
      fallbackInvoices.set(record.invoiceNo, record);
      fallbackInvoices.set(orderId, record);
      return record;
    }
  } catch (err) {
    console.warn("[INVOICES] Gagal menyimpan ke DB, menggunakan fallback in-memory:", err);
  }

  const fallbackRecord: InvoiceRecord = {
    id: `inv_${Date.now()}`,
    invoiceNo,
    publicToken,
    orderId,
    issuedAt: now,
    paidAt: snapshot.paidAt || null,
    snapshot,
  };
  fallbackInvoices.set(invoiceNo, fallbackRecord);
  fallbackInvoices.set(orderId, fallbackRecord);
  return fallbackRecord;
}

export async function getInvoiceByNo(
  invoiceNo: string,
  token?: string,
  isAdmin: boolean = false
): Promise<InvoiceRecord | null> {
  // Decode URL format jika nomor invoice ada garis miring ter-encode
  const decodedNo = decodeURIComponent(invoiceNo).trim();
  if (!decodedNo || decodedNo.length < 5) return null;

  try {
    let query = supabaseAdmin
      .from("invoices")
      .select("*")
      .or(`invoice_no.eq.${decodedNo},invoice_no.eq.${invoiceNo}`);

    const { data, error } = await query.maybeSingle();
    if (!error && data) {
      // PERTAHANAN ANTI-IDOR: Publik wajib menyediakan token hash 32-karakter yang valid
      if (!isAdmin) {
        if (!token || typeof token !== "string" || !data.public_token || data.public_token.trim() !== token.trim()) {
          return null;
        }
      }
      return {
        id: data.id,
        invoiceNo: data.invoice_no,
        publicToken: data.public_token,
        orderId: data.order_id,
        issuedAt: data.issued_at,
        paidAt: data.paid_at,
        snapshot: data.snapshot as InvoiceSnapshot,
      };
    }
  } catch (err) {
    console.warn("[INVOICES] DB fetch failed, checking in-memory cache:", err);
  }

  const cached = fallbackInvoices.get(decodedNo) || fallbackInvoices.get(invoiceNo);
  if (cached) {
    if (!isAdmin) {
      if (!token || typeof token !== "string" || !cached.publicToken || cached.publicToken.trim() !== token.trim()) {
        return null;
      }
    }
    return cached;
  }

  return null;
}

export async function getInvoiceByOrderId(
  orderId: string,
  token?: string,
  isAdmin: boolean = false
): Promise<InvoiceRecord | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("invoices")
      .select("*")
      .eq("order_id", orderId)
      .maybeSingle();

    if (!error && data) {
      if (!isAdmin) {
        if (!token || typeof token !== "string" || !data.public_token || data.public_token.trim() !== token.trim()) {
          return null;
        }
      }
      return {
        id: data.id,
        invoiceNo: data.invoice_no,
        publicToken: data.public_token,
        orderId: data.order_id,
        issuedAt: data.issued_at,
        paidAt: data.paid_at,
        snapshot: data.snapshot as InvoiceSnapshot,
      };
    }
  } catch {}

  const cached = fallbackInvoices.get(orderId);
  if (cached) {
    if (!isAdmin) {
      if (!token || typeof token !== "string" || !cached.publicToken || cached.publicToken.trim() !== token.trim()) {
        return null;
      }
    }
    return cached;
  }

  return null;
}

export async function markInvoicePaid(
  orderId: string
): Promise<{ success: boolean; invoice?: InvoiceRecord }> {
  const now = new Date().toISOString();

  try {
    const inv = await getInvoiceByOrderId(orderId, undefined, true);
    if (!inv) return { success: false };

    const updatedSnapshot: InvoiceSnapshot = {
      ...inv.snapshot,
      paymentStatus: "LUNAS",
      paidAt: now,
    };

    await supabaseAdmin
      .from("invoices")
      .update({
        paid_at: now,
        snapshot: updatedSnapshot,
      })
      .eq("order_id", orderId);

    const updatedRecord: InvoiceRecord = {
      ...inv,
      paidAt: now,
      snapshot: updatedSnapshot,
    };

    fallbackInvoices.set(inv.invoiceNo, updatedRecord);
    fallbackInvoices.set(orderId, updatedRecord);

    return { success: true, invoice: updatedRecord };
  } catch (err: any) {
    console.warn("[INVOICES] Failed marking invoice paid:", err);
    return { success: false };
  }
}
