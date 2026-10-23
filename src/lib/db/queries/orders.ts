import { supabaseAdmin } from "@/lib/supabase/admin";
import { OrderInput } from "@/lib/validators";
import { assignHub, getActiveHubs, FALLBACK_HUBS } from "@/modules/hubs";
import { InternalTariffShippingProvider } from "@/adapters/shipping/internal-tariff";
import { createOrGetInvoice, generateInvoiceNumber } from "@/modules/invoices";
import { generateUniqueCode } from "@/modules/payments";
import { notifyOrderCreated } from "@/modules/notifications";
import { registerMemoryOrder } from "@/modules/orders/service";

// In-memory fallback untuk ketahanan offline / testing
const memoryOrders = new Map<string, OrderRecord>();

export interface OrderItemRecord {
  id: string;
  orderId: string;
  productId: string | null;
  nameSnapshot: string;
  priceSnapshot: number;
  unitSnapshot: string | null;
  qty: number;
  designNote: string | null;
  total: number;
}

export interface CourierInfo {
  name: string;
  phone: string;
  plate: string;
  eta: string;
  notes?: string;
  currentLocation?: [number, number];
}

export interface OrderRecord {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  deliveryMethod: string;
  address: string | null;
  paymentMethod: string;
  note: string | null;
  courier?: CourierInfo | null;
  subtotal: number;
  deliveryFee?: number;
  delivery_fee?: number;
  hubId?: string | null;
  status: string;
  items: OrderItemRecord[];
  createdAt: string;
}

export function extractCourierInfo(rawNote: string | null, rawOrder?: any): { note: string | null; courier: CourierInfo | null } {
  let courier: CourierInfo | null = null;
  let cleanNote = rawNote || "";

  if (rawOrder && rawOrder.courier_name) {
    courier = {
      name: rawOrder.courier_name,
      phone: rawOrder.courier_phone || "",
      plate: rawOrder.courier_plate || "",
      eta: rawOrder.estimated_delivery_at || "15 - 25 Menit",
      notes: rawOrder.delivery_notes || "",
    };
  }

  if (cleanNote && cleanNote.includes("[COURIER_DATA:")) {
    const match = cleanNote.match(/\[COURIER_DATA:([\s\S]*?)\]/);
    if (match && match[1]) {
      try {
        const parsed = JSON.parse(match[1]);
        courier = {
          name: parsed.name || courier?.name || "Kurir Cetak.inc Padang",
          phone: parsed.phone || courier?.phone || "6282283995544",
          plate: parsed.plate || courier?.plate || "BA 4821 QA",
          eta: parsed.eta || courier?.eta || "15 - 25 Menit",
          notes: parsed.notes || courier?.notes || "",
        };
      } catch {}
      cleanNote = cleanNote.replace(/\[COURIER_DATA:[\s\S]*?\]/, "").trim();
    }
  }

  return { note: cleanNote || null, courier };
}

export function generateOrderCode(): string {
  const d = new Date();
  const yyyymmdd = d.toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `BAS-${yyyymmdd}-${randomSuffix}`;
}

export async function createOrder(
  input: OrderInput
): Promise<{ order: OrderRecord | null; invoice?: any; error?: string }> {
  try {
    const productIds = input.items.map((i) => i.productId);
    let prods: any[] = [];
    try {
      const { data, error: pErr } = await supabaseAdmin
        .from("products")
        .select("id, name, price, unit")
        .in("id", productIds);
      if (!pErr && data) {
        prods = data;
      }
    } catch (e: any) {
      console.warn("[ORDERS] Supabase products query offline, fallback ke products.json:", e?.message);
    }

    const prodMap = new Map<string, any>((prods || []).map((p: any) => [p.id, p]));

    // Fallback otomatis ke data products.json jika produk belum tersimpan di Supabase
    if (prodMap.size < productIds.length) {
      try {
        const fs = await import("fs");
        const path = await import("path");
        const jsonPath = path.join(process.cwd(), "src", "data", "products.json");
        if (fs.existsSync(jsonPath)) {
          const raw = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
          for (const item of raw) {
            if (!prodMap.has(item.id)) {
              prodMap.set(item.id, {
                id: item.id,
                name: item.name || item.title || "Produk Cetak",
                price: item.priceNumber || (Number(String(item.price).replace(/\D/g, "")) || 25000),
                unit: item.unit || "/ pcs",
              });
            }
          }
        }
      } catch {}
    }

    const itemsToInsert: any[] = [];
    let calculatedSubtotal = 0;

    for (const item of input.items) {
      const prod = prodMap.get(item.productId);
      const unitPrice = prod ? Number(prod.price) : 0;
      const prodName = prod ? prod.name : "Produk Custom";
      const itemSubtotal = unitPrice * item.qty;
      calculatedSubtotal += itemSubtotal;

      const itemId = "item-" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

      itemsToInsert.push({
        id: itemId,
        product_id: item.productId,
        product_name: prodName,
        product_price: unitPrice,
        qty: item.qty,
        subtotal: itemSubtotal,
        design_note: item.designNote || null,
      });
    }

    const orderId = "ord-" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const orderCode = generateOrderCode();
    const now = new Date().toISOString();

    // 3. Alokasi Hub Otomatis berdasarkan alamat & koordinat (Blueprint V2 Fase 2)
    let assignedHubId = input.hubId || null;
    if (!assignedHubId && input.deliveryMethod === "kirim") {
      try {
        const assignment = await assignHub({
          lat: input.destLat,
          lng: input.destLng,
          address: input.destAddress || input.address,
        });
        assignedHubId = assignment.hubId;
      } catch {}
    }

    // 4. Kalkulasi & Verifikasi Ongkir Otoritatif di Sisi Server (Anti-Price Tampering)
    let validatedDeliveryFee = 0;
    if (input.deliveryMethod === "pickup") {
      validatedDeliveryFee = 0;
    } else {
      if (calculatedSubtotal >= 300000) {
        validatedDeliveryFee = 0;
      } else if (input.destLat && input.destLng) {
        try {
          const hubs = await getActiveHubs();
          const targetHub = hubs.find((h) => h.id === assignedHubId) || hubs[0] || FALLBACK_HUBS[0];
          const provider = new InternalTariffShippingProvider();
          const quote = await provider.quote({
            from: { lat: targetHub.lat, lng: targetHub.lng },
            to: { lat: input.destLat, lng: input.destLng },
            hubId: targetHub.id,
            subtotal: calculatedSubtotal,
          });
          if (quote) {
            validatedDeliveryFee = quote.price;
          } else {
            validatedDeliveryFee = Math.max(Number(input.deliveryFee) || 8000, 8000);
          }
        } catch {
          validatedDeliveryFee = Math.max(Number(input.deliveryFee) || 8000, 8000);
        }
      } else {
        validatedDeliveryFee = Math.max(Number(input.deliveryFee) || 8000, 8000);
      }
    }

    const fullOrderPayload: Record<string, any> = {
      id: orderId,
      code: orderCode,
      customer_name: input.customerName,
      customer_phone: input.customerPhone,
      delivery_method: input.deliveryMethod,
      address: input.address || null,
      dest_lat: input.destLat || null,
      dest_lng: input.destLng || null,
      dest_address: input.destAddress || input.address || null,
      dest_note: input.destNote || null,
      delivery_fee: validatedDeliveryFee,
      hub_id: assignedHubId,
      payment_method: input.paymentMethod,
      note: input.note || null,
      subtotal: calculatedSubtotal,
      status: "BARU",
      created_at: now,
      updated_at: now,
    };

    let ordErr: any = null;
    try {
      const res = await supabaseAdmin.from("orders").insert(fullOrderPayload);
      ordErr = res.error;

      // Fallback: Jika tabel di Supabase belum di-alter dengan kolom baru, insert payload dasar
      if (ordErr && (ordErr.message.includes("column") || ordErr.message.includes("schema cache"))) {
        console.warn("[ORDERS] Fallback insert dengan kolom dasar:", ordErr.message);
        const basePayload = {
          id: orderId,
          code: orderCode,
          customer_name: input.customerName,
          customer_phone: input.customerPhone,
          delivery_method: input.deliveryMethod,
          address: input.address || null,
          payment_method: input.paymentMethod,
          note: input.note || null,
          subtotal: calculatedSubtotal,
          status: "BARU",
          created_at: now,
          updated_at: now,
        };
        const retry = await supabaseAdmin.from("orders").insert(basePayload);
        ordErr = retry.error;
      }
      if (ordErr) {
        console.warn("[ORDERS] Gagal insert orders ke Supabase, simpan ke memory fallback:", ordErr.message);
      }
    } catch (e: any) {
      console.warn("[ORDERS] Exception saat insert orders ke Supabase, gunakan memory fallback:", e?.message);
    }

    // Insert order items
    const finalItems = itemsToInsert.map((item) => ({
      ...item,
      order_id: orderId,
      created_at: now,
    }));

    try {
      const { error: itemsErr } = await supabaseAdmin.from("order_items").insert(finalItems);
      if (itemsErr) {
        console.warn("[SUPABASE] Gagal simpan order_items:", itemsErr.message);
      }
    } catch (e: any) {
      console.warn("[SUPABASE] Exception simpan order_items:", e?.message);
    }

    const createdOrder: OrderRecord = {
      id: orderId,
      code: orderCode,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      deliveryMethod: input.deliveryMethod,
      address: input.address || null,
      paymentMethod: input.paymentMethod,
      note: input.note || null,
      subtotal: calculatedSubtotal,
      deliveryFee: validatedDeliveryFee,
      delivery_fee: validatedDeliveryFee,
      hubId: assignedHubId,
      status: "BARU",
      items: finalItems.map((it) => ({
        id: it.id,
        orderId,
        productId: it.product_id,
        nameSnapshot: it.product_name,
        priceSnapshot: it.product_price,
        unitSnapshot: "/ pcs",
        qty: it.qty,
        designNote: it.design_note,
        total: it.subtotal,
      })),
      createdAt: now,
    };

    // Auto-generate invoice snapshot (Blueprint V2 Fase 4)
    let createdInvoice: any = null;
    try {
      const uniqueCode = generateUniqueCode();
      const deliveryFee = validatedDeliveryFee;
      const grandTotal = calculatedSubtotal + deliveryFee + uniqueCode;

      createdInvoice = await createOrGetInvoice(orderId, {
        invoiceNo: generateInvoiceNumber(),
        orderCode,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        deliveryMethod: input.deliveryMethod === "kirim" ? "Kurir Workshop" : "Ambil di Workshop",
        deliveryAddress: input.destAddress || input.address || null,
        hubName: assignedHubId?.includes("lubuk") ? "Hub Lubuk Buaya" : "Hub Pusat Padang",
        items: finalItems.map((it) => ({
          name: it.product_name,
          specs: it.design_note || undefined,
          qty: it.qty,
          unitPrice: it.product_price,
          subtotal: it.subtotal,
        })),
        subtotal: calculatedSubtotal,
        deliveryFee,
        uniqueCode,
        total: grandTotal,
        paymentStatus: "BELUM_DIBAYAR",
        issuedAt: now,
      });

      // Kirim Notifikasi WhatsApp Otomatis ke Pelanggan (Non-blocking)
      notifyOrderCreated({
        phone: input.customerPhone,
        customerName: input.customerName,
        orderCode,
        total: grandTotal,
        invoiceNo: createdInvoice?.invoiceNo,
      }).catch((waErr) => console.warn("[ORDERS] Gagal auto-trigger WA:", waErr));
    } catch (e) {
      console.warn("[ORDERS] Gagal auto-generate invoice:", e);
    }

    // Register ke in-memory cache untuk fallback lokal/offline/testing
    memoryOrders.set(orderId, createdOrder);
    memoryOrders.set(orderCode, createdOrder);
    try {
      registerMemoryOrder({
        id: orderId,
        code: orderCode,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        deliveryMethod: input.deliveryMethod,
        address: input.address || null,
        destLat: input.destLat,
        destLng: input.destLng,
        destAddress: input.destAddress,
        destNote: input.destNote,
        deliveryFee: validatedDeliveryFee,
        paymentMethod: input.paymentMethod,
        paymentStatus: "UNPAID",
        uniqueCode: 0,
        hubId: assignedHubId,
        note: input.note || null,
        subtotal: calculatedSubtotal,
        status: "BARU",
        items: finalItems.map((it) => ({
          id: it.id,
          orderId,
          productId: it.product_id,
          productName: it.product_name,
          price: it.product_price,
          qty: it.qty,
          subtotal: it.subtotal,
          designNote: it.design_note,
        })),
        createdAt: now,
        updatedAt: now,
      });
    } catch {}

    return { order: createdOrder, invoice: createdInvoice };
  } catch (err: any) {
    return { order: null, error: err.message || "Gagal membuat pesanan" };
  }
}

export async function getOrders(options?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ orders: OrderRecord[]; total: number }> {
  try {
    let query = supabaseAdmin
      .from("orders")
      .select("*, order_items(*)", { count: "exact" })
      .order("created_at", { ascending: false });

    if (options?.status && options.status !== "SEMUA") {
      query = query.eq("status", options.status);
    }

    if (options?.limit) {
      const start = options.offset || 0;
      query = query.range(start, start + options.limit - 1);
    }

    const { data, count, error } = await query;
    if (error || !data) {
      console.error("[SUPABASE] Gagal memuat pesanan:", error?.message);
      return { orders: [], total: 0 };
    }

    const orders: OrderRecord[] = data.map((o: any) => {
      const { note: cleanNote, courier } = extractCourierInfo(o.note, o);
      return {
        id: o.id,
        code: o.code,
        customerName: o.customer_name,
        customerPhone: o.customer_phone,
        deliveryMethod: o.delivery_method,
        address: o.address,
        paymentMethod: o.payment_method,
        note: cleanNote,
        courier: courier || null,
        subtotal: Number(o.subtotal) || 0,
        status: o.status,
        items: (o.order_items || []).map((it: any) => ({
          id: it.id,
          orderId: it.order_id,
          productId: it.product_id,
          nameSnapshot: it.name_snapshot || it.product_name,
          priceSnapshot: Number(it.price_snapshot || it.product_price) || 0,
          unitSnapshot: it.unit_snapshot || "/ pcs",
          qty: it.qty,
          designNote: it.design_note,
          total: Number(it.total || it.subtotal) || 0,
        })),
        createdAt: o.created_at,
      };
    });

    return {
      orders,
      total: count !== null ? count : orders.length,
    };
  } catch (err: any) {
    console.error("[SUPABASE_ERR] Error getOrders:", err);
    return { orders: [], total: 0 };
  }
}

export async function getOrderById(id: string): Promise<OrderRecord | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*, order_items(*)")
      .or(`id.eq.${id},code.eq.${id}`)
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      const memory = memoryOrders.get(id);
      if (memory) return memory;
      return null;
    }

    const { note: cleanNote, courier } = extractCourierInfo(data.note, data);

    return {
      id: data.id,
      code: data.code,
      customerName: data.customer_name,
      customerPhone: data.customer_phone,
      deliveryMethod: data.delivery_method,
      address: data.address,
      paymentMethod: data.payment_method,
      note: cleanNote,
      courier: courier || null,
      subtotal: Number(data.subtotal) || 0,
      status: data.status,
      items: (data.order_items || []).map((it: any) => ({
        id: it.id,
        orderId: it.order_id,
        productId: it.product_id,
        nameSnapshot: it.name_snapshot || it.product_name,
        priceSnapshot: Number(it.price_snapshot || it.product_price) || 0,
        unitSnapshot: it.unit_snapshot || "/ pcs",
        qty: it.qty,
        designNote: it.design_note,
        total: Number(it.total || it.subtotal) || 0,
      })),
      createdAt: data.created_at,
    };
  } catch {
    const memory = memoryOrders.get(id);
    if (memory) return memory;
    return null;
  }
}

export async function updateOrderStatus(
  id: string,
  status: string,
  courierData?: CourierInfo | null
): Promise<boolean> {
  const now = new Date().toISOString();

  // Update in-memory fallback cache
  const memory = memoryOrders.get(id);
  if (memory) {
    memory.status = status;
    if (courierData) {
      memory.courier = courierData;
    }
    memoryOrders.set(memory.id, memory);
    if (memory.code) memoryOrders.set(memory.code, memory);
  }

  if (courierData && (courierData.name || courierData.plate)) {
    // 1. Coba update ke kolom native jika kolom sudah ada di Supabase
    const { error: nativeErr } = await supabaseAdmin
      .from("orders")
      .update({
        status,
        updated_at: now,
        courier_name: courierData.name || null,
        courier_phone: courierData.phone || null,
        courier_plate: courierData.plate || null,
        estimated_delivery_at: courierData.eta || null,
        delivery_notes: courierData.notes || null,
      })
      .or(`id.eq.${id},code.eq.${id}`);

    if (!nativeErr) {
      return true;
    }

    // 2. Jika kolom native belum ada di schema DB, simpan fallback dengan menyisipkan [COURIER_DATA:...] pada kolom note
    const { data: existing } = await supabaseAdmin
      .from("orders")
      .select("note")
      .or(`id.eq.${id},code.eq.${id}`)
      .limit(1)
      .maybeSingle();

    const currentNote = existing?.note || "";
    const cleanNote = currentNote.replace(/\[COURIER_DATA:[\s\S]*?\]/, "").trim();
    const newNote = `${cleanNote ? cleanNote + "\n" : ""}[COURIER_DATA:${JSON.stringify(courierData)}]`;

    const { error: fallbackErr } = await supabaseAdmin
      .from("orders")
      .update({
        status,
        note: newNote,
        updated_at: now,
      })
      .or(`id.eq.${id},code.eq.${id}`);

    return !fallbackErr;
  }

  const { error } = await supabaseAdmin
    .from("orders")
    .update({ status, updated_at: now })
    .or(`id.eq.${id},code.eq.${id}`);

  return !error;
}
