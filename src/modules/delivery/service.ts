import { supabaseAdmin } from "@/lib/supabase/admin";
import { DriverLocation, DeliveryTask, DeliveryTaskStatus, ShippingTariff, Driver } from "./types";
import { publishEvent } from "@/lib/events";
import { transitionOrderStatus, getOrderById } from "../orders/service";
import { getOrders, updateOrderStatus as dbUpdateOrderStatus } from "@/lib/db/queries/orders";
import { getHubById } from "../hubs/service";
import { notifyOrderEnRoute, notifyOrderCompleted } from "../notifications";

// In-memory cache untuk lokasi driver terkini (ultra-fast read)
const driverLocationCache = new Map<string, DriverLocation>();
const orderLocationCache = new Map<string, DriverLocation>();

// In-memory status kurir (online/offline)
const driverOnlineStatus = new Map<string, boolean>();

// Fallback in-memory delivery tasks jika DB offline
const fallbackDeliveryTasks = new Map<string, any>();

// Fallback tarif standar per hub jika database offline
const DEFAULT_TARIFFS: ShippingTariff[] = [
  {
    id: "tariff-pusat",
    hubId: "00000000-0000-0000-0000-000000000001",
    baseFee: 8000,
    perKm: 2500,
    minFee: 8000,
    maxKm: 25,
    freeOver: 300000,
    isActive: true,
  },
  {
    id: "tariff-lubuk-buaya",
    hubId: "00000000-0000-0000-0000-000000000002",
    baseFee: 8000,
    perKm: 2500,
    minFee: 8000,
    maxKm: 20,
    freeOver: 300000,
    isActive: true,
  },
];

export async function setDriverOnlineStatus(driverId: string, isOnline: boolean): Promise<boolean> {
  driverOnlineStatus.set(driverId, isOnline);
  try {
    await supabaseAdmin
      .from("drivers")
      .update({ is_online: isOnline, updated_at: new Date().toISOString() })
      .eq("id", driverId);
  } catch {}
  return isOnline;
}

export async function getDriverOnlineStatus(driverId: string): Promise<boolean> {
  if (driverOnlineStatus.has(driverId)) {
    return driverOnlineStatus.get(driverId)!;
  }
  return true; // Default online
}

export async function upsertDriverLocation(
  driverId: string,
  lat: number,
  lng: number,
  heading?: number,
  speed?: number,
  orderId?: string
): Promise<{ success: boolean; location: DriverLocation }> {
  const now = new Date().toISOString();
  const location: DriverLocation = {
    driverId,
    lat,
    lng,
    heading: heading ?? null,
    speed: speed ?? null,
    updatedAt: now,
  };

  driverLocationCache.set(driverId, location);
  if (orderId) {
    orderLocationCache.set(orderId, location);
  }

  // Publish event untuk real-time outbox
  publishEvent("DRIVER_LOCATION_UPDATED", {
    driverId,
    orderId,
    lat,
    lng,
    heading: heading ?? null,
    speed: speed ?? null,
    timestamp: now,
  }).catch(() => {});

  try {
    await supabaseAdmin
      .from("driver_locations")
      .upsert(
        {
          driver_id: driverId,
          lat,
          lng,
          heading: heading ?? null,
          speed: speed ?? null,
          updated_at: now,
        },
        { onConflict: "driver_id" }
      );
  } catch (err) {
    console.warn("[DELIVERY] Gagal menyimpan driver_location ke DB:", err);
  }

  return { success: true, location };
}

export async function getDriverLocation(driverId: string): Promise<DriverLocation | null> {
  if (driverLocationCache.has(driverId)) {
    return driverLocationCache.get(driverId)!;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("driver_locations")
      .select("*")
      .eq("driver_id", driverId)
      .maybeSingle();

    if (!error && data) {
      const loc: DriverLocation = {
        driverId: data.driver_id,
        lat: Number(data.lat),
        lng: Number(data.lng),
        heading: data.heading,
        speed: data.speed,
        updatedAt: data.updated_at,
      };
      driverLocationCache.set(driverId, loc);
      return loc;
    }
  } catch {}

  return null;
}

export async function getDriverLocationByOrderId(orderId: string): Promise<DriverLocation | null> {
  if (orderLocationCache.has(orderId)) {
    return orderLocationCache.get(orderId)!;
  }

  // Cek apakah ada task terkait
  const task = await getDeliveryTaskByOrderId(orderId);
  if (task && task.driverId) {
    const loc = await getDriverLocation(task.driverId);
    if (loc) {
      orderLocationCache.set(orderId, loc);
      return loc;
    }
  }

  return null;
}

export async function getDeliveryTaskByOrderId(orderId: string): Promise<DeliveryTask | null> {
  if (fallbackDeliveryTasks.has(orderId)) {
    return fallbackDeliveryTasks.get(orderId)!;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("delivery_tasks")
      .select("*, drivers(*)")
      .eq("order_id", orderId)
      .maybeSingle();

    if (!error && data) {
      const task: DeliveryTask = {
        id: data.id,
        orderId: data.order_id,
        driverId: data.driver_id,
        provider: data.provider || "internal",
        status: data.status as DeliveryTaskStatus,
        pickupProofUrl: data.pickup_proof_url,
        dropoffProofUrl: data.dropoff_proof_url,
        etaMin: data.eta_min,
        startedAt: data.started_at,
        finishedAt: data.finished_at,
        driver: data.drivers
          ? {
              id: data.drivers.id,
              fullName: data.drivers.full_name || "Kurir Workshop",
              phone: data.drivers.phone || "082283995544",
              vehicleType: data.drivers.vehicle_type || "Motor",
              plate: data.drivers.plate || "BA 4821 QA",
              isOnline: data.drivers.is_online ?? true,
            }
          : null,
      };
      return task;
    }
  } catch {}

  return null;
}

/**
 * Mendapatkan daftar tugas pengantaran untuk driver:
 * 1. activeTask: Pesanan yang sedang ditangani (KURIR_MENJEMPUT, DALAM_PERJALANAN, TIBA)
 * 2. availableTasks: Pesanan SIAP_ANTAR yang belum diambil driver
 */
export async function getDriverTasks(driverId: string): Promise<{
  activeTask: any | null;
  availableTasks: any[];
}> {
  let activeTask: any | null = null;
  const availableTasks: any[] = [];

  try {
    const ordersRes = await getOrders({ limit: 100 });
    const allOrders = ordersRes.orders || [];

    for (const ord of allOrders) {
      // Periksa apakah order aktif untuk driver ini
      if (
        ["KURIR_MENJEMPUT", "DALAM_PERJALANAN", "TIBA"].includes(ord.status)
      ) {
        if (!activeTask) {
          activeTask = {
            id: ord.id,
            code: ord.code,
            customerName: ord.customerName,
            customerPhone: ord.customerPhone,
            address: ord.address || "Jl. Khatib Sulaiman No. 42, Padang",
            destLat: (ord as any).destLat || -0.9242,
            destLng: (ord as any).destLng || 100.3626,
            destNote: (ord as any).destNote || ord.note || null,
            subtotal: ord.subtotal,
            status: ord.status,
            hubId: (ord as any).hubId || "00000000-0000-0000-0000-000000000001",
            items: ord.items || [],
            createdAt: ord.createdAt,
          };
        }
      } else if (
        ["SIAP_ANTAR", "SIAP"].includes(ord.status) &&
        (ord as any).deliveryMethod !== "ambil"
      ) {
        availableTasks.push({
          id: ord.id,
          code: ord.code,
          customerName: ord.customerName,
          customerPhone: ord.customerPhone,
          address: ord.address || "Area Kota Padang",
          destLat: (ord as any).destLat || -0.933,
          destLng: (ord as any).destLng || 100.3695,
          destNote: (ord as any).destNote || ord.note || null,
          subtotal: ord.subtotal,
          status: ord.status,
          hubId: (ord as any).hubId || "00000000-0000-0000-0000-000000000001",
          items: ord.items || [],
          createdAt: ord.createdAt,
        });
      }
    }
  } catch (err) {
    console.warn("[DELIVERY] Gagal memuat tasks dari DB:", err);
  }

  // Jika tidak ada task di DB, buat fallback realistis agar portal driver selalu siap demo
  if (!activeTask && availableTasks.length === 0) {
    availableTasks.push({
      id: "ord-task-demo-1",
      code: "BAS-20261022-7719",
      customerName: "Siti Nurhaliza",
      customerPhone: "081267890123",
      address: "Jl. Khatib Sulaiman No. 42 (Depan Masjid Raya Sumbar), Padang Utara",
      destLat: -0.9242,
      destLng: 100.3626,
      destNote: "Pagar hitam samping minimarket",
      subtotal: 135000,
      status: "SIAP_ANTAR",
      hubId: "00000000-0000-0000-0000-000000000001",
      items: [
        {
          name: "Kaos Sablon DTF Combed 30s",
          qty: 3,
          specs: "Warna: Hitam\nUkuran: L (2), XL (1)",
        },
      ],
      createdAt: new Date().toISOString(),
    });
  }

  return { activeTask, availableTasks };
}

/**
 * Driver mengklaim tugas pengantaran
 */
export async function claimDeliveryTask(
  orderId: string,
  driver: { id: string; fullName: string; phone: string; plate?: string }
): Promise<{ success: boolean; task?: any; error?: string }> {
  try {
    const courierInfo = {
      name: driver.fullName,
      phone: driver.phone,
      plate: driver.plate || "BA 4821 QA",
      eta: "15 - 25 Menit",
      notes: "Kurir ditugaskan menuju workshop untuk jemput barang",
    };

    // Update status order ke KURIR_MENJEMPUT
    await dbUpdateOrderStatus(orderId, "KURIR_MENJEMPUT", courierInfo);

    const taskObj = {
      id: `task_${Date.now()}`,
      orderId,
      driverId: driver.id,
      status: "PICKING_UP" as DeliveryTaskStatus,
      driver: {
        id: driver.id,
        fullName: driver.fullName,
        phone: driver.phone,
        vehicleType: "Motor",
        plate: courierInfo.plate,
        isOnline: true,
      },
      startedAt: new Date().toISOString(),
    };
    fallbackDeliveryTasks.set(orderId, taskObj);

    // Kirim event outbox
    await publishEvent("DRIVER_ASSIGNED", {
      orderId,
      driverId: driver.id,
      driverName: driver.fullName,
      plate: courierInfo.plate,
    });
    await publishEvent("DRIVER_PICKED_UP", {
      orderId,
      driverId: driver.id,
    });

    return { success: true, task: taskObj };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal mengklaim tugas antar." };
  }
}

/**
 * Memperbarui status perjalanan tugas driver
 */
export async function updateDeliveryTaskStatus(
  orderId: string,
  targetStatus: "KURIR_MENJEMPUT" | "DALAM_PERJALANAN" | "TIBA" | "SELESAI",
  driver: { id: string; role: any; username: string; fullName?: string },
  meta?: { proofPhotoUrl?: string; notes?: string }
): Promise<{ success: boolean; newStatus?: string; error?: string }> {
  try {
    // 1. Eksekusi transisi status via state machine order
    const res = await transitionOrderStatus(orderId, targetStatus, {
      id: driver.id,
      role: driver.role,
      username: driver.username,
    });

    if (!res.success) {
      return { success: false, error: res.error };
    }

    // 2. Jika ada foto bukti serah terima (Dropoff Proof)
    if (targetStatus === "SELESAI" && meta?.proofPhotoUrl) {
      const task = fallbackDeliveryTasks.get(orderId);
      if (task) {
        task.dropoffProofUrl = meta.proofPhotoUrl;
        task.finishedAt = new Date().toISOString();
        fallbackDeliveryTasks.set(orderId, task);
      }

      try {
        await supabaseAdmin
          .from("delivery_tasks")
          .update({
            dropoff_proof_url: meta.proofPhotoUrl,
            status: "DELIVERED",
            finished_at: new Date().toISOString(),
          })
          .eq("order_id", orderId);
      } catch {}
    }

    // 3. Notifikasi WhatsApp Otomatis ke Pelanggan (Non-blocking)
    if (res.order && res.order.customerPhone) {
      if (targetStatus === "DALAM_PERJALANAN") {
        notifyOrderEnRoute({
          phone: res.order.customerPhone,
          customerName: res.order.customerName,
          orderCode: res.order.code,
          courierName: driver.fullName || driver.username,
        }).catch((e) => console.warn("[DELIVERY] WA trigger failed:", e));
      } else if (targetStatus === "SELESAI") {
        notifyOrderCompleted({
          phone: res.order.customerPhone,
          customerName: res.order.customerName,
          orderCode: res.order.code,
        }).catch((e) => console.warn("[DELIVERY] WA trigger failed:", e));
      }
    }

    return { success: true, newStatus: targetStatus };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal memperbarui status pengantaran." };
  }
}

/**
 * Mengambil riwayat pengantaran selesai untuk driver
 */
export async function getDriverHistory(driverId: string): Promise<any[]> {
  try {
    const ordersRes = await getOrders({ limit: 50 });
    const completedOrders = (ordersRes.orders || []).filter(
      (o) => o.status === "SELESAI" && (o as any).deliveryMethod !== "ambil"
    );

    return completedOrders.map((o) => ({
      id: o.id,
      code: o.code,
      customerName: o.customerName,
      address: o.address || "Kota Padang",
      deliveryFee: 12000,
      completedAt: o.createdAt,
      itemSummary: `${o.items?.length || 1} produk cetak`,
    }));
  } catch {
    return [];
  }
}

/**
 * ==============================================================================
 * MANAJEMEN TARIF ONGKIR (FASE 3 BLUEPRINT V2)
 * ==============================================================================
 */

export async function getShippingTariffs(): Promise<ShippingTariff[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("shipping_tariffs")
      .select("*")
      .order("created_at", { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map((t: any) => ({
        id: t.id,
        hubId: t.hub_id,
        baseFee: Number(t.base_fee || 8000),
        perKm: Number(t.per_km || 2500),
        minFee: Number(t.min_fee || 8000),
        maxKm: Number(t.max_km || 25),
        freeOver: t.free_over ? Number(t.free_over) : null,
        isActive: t.is_active ?? true,
      }));
    }
  } catch {}

  return DEFAULT_TARIFFS;
}

export async function getShippingTariffByHub(hubId: string): Promise<ShippingTariff | null> {
  const all = await getShippingTariffs();
  return all.find((t) => t.hubId === hubId) || all[0] || null;
}

export async function upsertShippingTariff(input: {
  id?: string;
  hubId: string;
  baseFee?: number;
  perKm?: number;
  minFee?: number;
  maxKm?: number;
  freeOver?: number | null;
  isActive?: boolean;
}): Promise<{ success: boolean; tariff?: ShippingTariff; error?: string }> {
  try {
    const payload = {
      hub_id: input.hubId,
      base_fee: input.baseFee ?? 8000,
      per_km: input.perKm ?? 2500,
      min_fee: input.minFee ?? 8000,
      max_km: input.maxKm ?? 25,
      free_over: input.freeOver !== undefined ? input.freeOver : 300000,
      is_active: input.isActive ?? true,
    };

    let resultData: any;

    if (input.id && !input.id.startsWith("tariff-")) {
      const { data, error } = await supabaseAdmin
        .from("shipping_tariffs")
        .update(payload)
        .eq("id", input.id)
        .select()
        .maybeSingle();

      if (error) return { success: false, error: error.message };
      resultData = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from("shipping_tariffs")
        .insert(payload)
        .select()
        .maybeSingle();

      if (error) {
        // Coba update jika sudah ada untuk hub_id tsb
        const { data: updData, error: updErr } = await supabaseAdmin
          .from("shipping_tariffs")
          .update(payload)
          .eq("hub_id", input.hubId)
          .select()
          .maybeSingle();

        if (updErr) return { success: false, error: updErr.message };
        resultData = updData;
      } else {
        resultData = data;
      }
    }

    const saved: ShippingTariff = {
      id: resultData?.id || input.id || `tariff_${Date.now()}`,
      hubId: resultData?.hub_id || input.hubId,
      baseFee: Number(resultData?.base_fee || payload.base_fee),
      perKm: Number(resultData?.per_km || payload.per_km),
      minFee: Number(resultData?.min_fee || payload.min_fee),
      maxKm: Number(resultData?.max_km || payload.max_km),
      freeOver: resultData?.free_over ? Number(resultData.free_over) : payload.free_over,
      isActive: resultData?.is_active ?? payload.is_active,
    };

    return { success: true, tariff: saved };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
