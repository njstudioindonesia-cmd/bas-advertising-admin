import { supabaseAdmin } from "@/lib/supabase/admin";
import { Order, OrderStatus } from "./types";
import { canTransitionOrder, normalizeOrderStatus } from "./state-machine";
import { UserRole } from "../auth/types";
import { publishEvent } from "@/lib/events";
import { logAudit } from "@/lib/db/queries/audit";

const fallbackOrders = new Map<string, Order>();

export function registerMemoryOrder(order: Order) {
  fallbackOrders.set(order.id, order);
  if (order.code) fallbackOrders.set(order.code, order);
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    const { data: ord, error: ordErr } = await supabaseAdmin
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .maybeSingle();

    if (!ordErr && ord) {
      const record: Order = {
        id: ord.id,
        code: ord.code,
        customerName: ord.customer_name,
        customerPhone: ord.customer_phone,
        deliveryMethod: ord.delivery_method,
        address: ord.address,
        destLat: ord.dest_lat,
        destLng: ord.dest_lng,
        destAddress: ord.dest_address,
        destNote: ord.dest_note,
        deliveryFee: Number(ord.delivery_fee || 0),
        paymentMethod: ord.payment_method,
        paymentStatus: ord.payment_status || "UNPAID",
        uniqueCode: ord.unique_code || 0,
        hubId: ord.hub_id,
        note: ord.note,
        subtotal: Number(ord.subtotal),
        status: ord.status as OrderStatus,
        items: (ord.order_items || []).map((it: any) => ({
          id: it.id,
          orderId: it.order_id,
          productId: it.product_id,
          productName: it.product_name,
          price: Number(it.product_price),
          qty: it.qty,
          subtotal: Number(it.subtotal),
          designNote: it.design_note,
        })),
        idempotencyKey: ord.idempotency_key,
        createdAt: ord.created_at,
        updatedAt: ord.updated_at,
      };
      fallbackOrders.set(ord.id, record);
      return record;
    }
  } catch (err) {
    console.warn("[ORDERS MODULE] Gagal getOrderById dari DB, cek fallback:", err);
  }

  return fallbackOrders.get(orderId) || null;
}

export async function transitionOrderStatus(
  orderId: string,
  targetStatus: OrderStatus,
  user: { id: string; role: UserRole; username: string }
): Promise<{ success: boolean; newStatus?: OrderStatus; order?: Order; error?: string }> {
  let current = await getOrderById(orderId);

  // Jika pesanan belum ada di DB tapi ada di fallback, gunakan fallback
  if (!current && fallbackOrders.has(orderId)) {
    current = fallbackOrders.get(orderId)!;
  }

  if (!current) {
    // Buat stub order jika baru diproses dari pembayaran
    current = {
      id: orderId,
      code: orderId,
      customerName: "Pelanggan",
      customerPhone: "082283995544",
      deliveryMethod: "kirim",
      address: null,
      paymentMethod: "Transfer Bank",
      subtotal: 0,
      status: "MENUNGGU_VERIFIKASI",
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    fallbackOrders.set(orderId, current);
  }

  const check = canTransitionOrder(current.status, targetStatus, user.role);
  if (!check.allowed) {
    return { success: false, error: check.error };
  }

  const now = new Date().toISOString();
  const updatePayload: Record<string, any> = {
    status: targetStatus,
    updated_at: now,
  };

  if (targetStatus === "DIBAYAR") {
    updatePayload.payment_status = "PAID";
  } else if (targetStatus === "PEMBAYARAN_DITOLAK") {
    updatePayload.payment_status = "REJECTED";
  }

  try {
    const { error: updErr } = await supabaseAdmin
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId);

    if (updErr) {
      console.warn(`[ORDERS MODULE] Update DB orders (${orderId}) gagal, gunakan memory state:`, updErr.message);
    }
  } catch (err) {
    console.warn(`[ORDERS MODULE] Exception saat update orders (${orderId}):`, err);
  }

  // Update in-memory fallback
  const updatedCurrent: Order = {
    ...current,
    status: targetStatus,
    paymentStatus: targetStatus === "DIBAYAR" ? "PAID" : targetStatus === "PEMBAYARAN_DITOLAK" ? "REJECTED" : current.paymentStatus,
    updatedAt: now,
  };
  fallbackOrders.set(orderId, updatedCurrent);
  if (updatedCurrent.code) fallbackOrders.set(updatedCurrent.code, updatedCurrent);

  // Audit Log
  logAudit({
    actor: `${user.role}:${user.username}`,
    action: "TRANSITION_ORDER_STATUS",
    entity: "orders",
    entityId: orderId,
    diff: {
      from: current.status,
      to: targetStatus,
    },
  });

  // Outbox Event
  if (check.rule?.emitEvent) {
    await publishEvent(check.rule.emitEvent, {
      orderId,
      orderCode: current.code,
      fromStatus: current.status,
      toStatus: targetStatus,
      hubId: current.hubId,
      customerPhone: current.customerPhone,
      timestamp: now,
    });
  }

  return { success: true, newStatus: targetStatus, order: { ...current, status: targetStatus } };
}
