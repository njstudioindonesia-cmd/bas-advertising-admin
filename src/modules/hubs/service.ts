import { supabaseAdmin } from "@/lib/supabase/admin";
import { Hub, HubServiceArea, HubAssignmentResult } from "./types";
import { calculateHaversineKm } from "../geo/distance";

export const FALLBACK_HUBS: Hub[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Hub Pusat BAS Advertising Padang",
    slug: "hub-padang-pusat",
    address: "Jl. Belanti Baru No. 17, Lolong Belanti, Kec. Padang Utara, Kota Padang, Sumatera Barat",
    lat: -0.9025,
    lng: 100.3542,
    phone: "082283995544",
    whatsapp: "6282283995544",
    maxRadiusKm: 25,
    dailyCapacity: 150,
    isActive: true,
    isOpen: true,
    notes: "Workshop Pusat - Fasilitas Cetak Lengkap (Spanduk, Digital A3+, Sablon, Akrilik)",
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    name: "Hub Lubuk Buaya (Workshop Cabang)",
    slug: "hub-lubuk-buaya",
    address: "Jl. Adinegoro No. 88, Lubuk Buaya, Kec. Koto Tangah, Kota Padang, Sumatera Barat",
    lat: -0.8354,
    lng: 100.315,
    phone: "082283995544",
    whatsapp: "6282283995544",
    maxRadiusKm: 20,
    dailyCapacity: 100,
    isActive: true,
    isOpen: true,
    notes: "Workshop Cabang Utara - Prioritas Pesanan Area Lubuk Buaya & Koto Tangah",
  },
];

export async function getActiveHubs(): Promise<Hub[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("hubs")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map((h: any) => ({
        id: h.id,
        name: h.name,
        slug: h.slug,
        address: h.address,
        lat: Number(h.lat),
        lng: Number(h.lng),
        phone: h.phone,
        whatsapp: h.whatsapp,
        maxRadiusKm: Number(h.max_radius_km || 15),
        dailyCapacity: Number(h.daily_capacity || 50),
        openingHours: h.opening_hours,
        isActive: h.is_active,
        isOpen: h.is_open,
        notes: h.notes,
        createdAt: h.created_at,
      }));
    }
  } catch (err) {
    console.warn("[HUBS MODULE] DB query gagal, menggunakan fallback hubs:", err);
  }

  return FALLBACK_HUBS;
}

export async function getAllHubsAdmin(): Promise<Hub[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("hubs")
      .select("*")
      .order("created_at", { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map((h: any) => ({
        id: h.id,
        name: h.name,
        slug: h.slug,
        address: h.address,
        lat: Number(h.lat),
        lng: Number(h.lng),
        phone: h.phone,
        whatsapp: h.whatsapp,
        maxRadiusKm: Number(h.max_radius_km || 15),
        dailyCapacity: Number(h.daily_capacity || 50),
        openingHours: h.opening_hours,
        isActive: h.is_active,
        isOpen: h.is_open,
        notes: h.notes,
        createdAt: h.created_at,
      }));
    }
  } catch {}

  return FALLBACK_HUBS;
}

export async function getHubById(id: string): Promise<Hub | null> {
  const hubs = await getAllHubsAdmin();
  return hubs.find((h) => h.id === id) || null;
}

/**
 * Algoritma Penugasan Hub Otomatis (Bagian 4.2 Blueprint V2)
 * 1. Prioritas area teks (misal: "Lubuk Buaya" -> Hub Lubuk Buaya)
 * 2. Jarak terdekat (Haversine km)
 * 3. Default ke Hub Pusat
 */
export async function assignHub(orderDest: {
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
}): Promise<HubAssignmentResult> {
  const hubs = await getActiveHubs();
  const hubLubukBuaya = hubs.find((h) => h.slug === "hub-lubuk-buaya") || hubs[1] || hubs[0];
  const hubPusat = hubs.find((h) => h.slug === "hub-padang-pusat") || hubs[0];

  const addr = (orderDest.address || "").toLowerCase();

  // 1. Aturan teks prioritas: jika alamat pelanggan menyebut Lubuk Buaya / Koto Tangah
  if (addr.includes("lubuk buaya") || addr.includes("lubukbuaya") || addr.includes("koto tangah")) {
    const dist =
      orderDest.lat && orderDest.lng
        ? calculateHaversineKm({ lat: orderDest.lat, lng: orderDest.lng }, { lat: hubLubukBuaya.lat, lng: hubLubukBuaya.lng })
        : 2.5;

    return {
      hubId: hubLubukBuaya.id,
      hubName: hubLubukBuaya.name,
      distanceKm: dist,
      matchedBy: "priority_area",
      isFallback: false,
    };
  }

  // 2. Jika koordinat GPS tersedia, cari hub terdekat yang aktif
  if (orderDest.lat && orderDest.lng) {
    const userCoord = { lat: orderDest.lat, lng: orderDest.lng };
    let nearestHub = hubPusat;
    let minDistance = calculateHaversineKm(userCoord, { lat: hubPusat.lat, lng: hubPusat.lng });

    for (const h of hubs) {
      const dist = calculateHaversineKm(userCoord, { lat: h.lat, lng: h.lng });
      if (dist < minDistance) {
        minDistance = dist;
        nearestHub = h;
      }
    }

    return {
      hubId: nearestHub.id,
      hubName: nearestHub.name,
      distanceKm: minDistance,
      matchedBy: "nearest_distance",
      isFallback: false,
    };
  }

  // 3. Fallback jika tanpa GPS: Hub Pusat
  return {
    hubId: hubPusat.id,
    hubName: hubPusat.name,
    distanceKm: 0,
    matchedBy: "default_hub",
    isFallback: true,
  };
}

export async function createHub(input: Partial<Hub>): Promise<{ success: boolean; hub?: Hub; error?: string }> {
  try {
    const slug = input.slug || (input.name || "hub").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const payload = {
      name: input.name,
      slug,
      address: input.address,
      lat: input.lat || -0.9025,
      lng: input.lng || 100.3542,
      phone: input.phone || "082283995544",
      whatsapp: input.whatsapp || "6282283995544",
      max_radius_km: input.maxRadiusKm || 15,
      daily_capacity: input.dailyCapacity || 50,
      is_active: input.isActive ?? true,
      is_open: input.isOpen ?? true,
      notes: input.notes,
    };

    const { data, error } = await supabaseAdmin.from("hubs").insert(payload).select().single();
    if (error) return { success: false, error: error.message };

    return {
      success: true,
      hub: {
        id: data.id,
        name: data.name,
        slug: data.slug,
        address: data.address,
        lat: Number(data.lat),
        lng: Number(data.lng),
        phone: data.phone,
        whatsapp: data.whatsapp,
        maxRadiusKm: Number(data.max_radius_km),
        dailyCapacity: Number(data.daily_capacity),
        isActive: data.is_active,
        isOpen: data.is_open,
        notes: data.notes,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateHub(
  id: string,
  input: Partial<Hub>
): Promise<{ success: boolean; hub?: Hub; error?: string }> {
  try {
    const fallbackIdx = FALLBACK_HUBS.findIndex((h) => h.id === id);
    if (fallbackIdx !== -1) {
      FALLBACK_HUBS[fallbackIdx] = {
        ...FALLBACK_HUBS[fallbackIdx],
        ...input,
      };
    }

    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (input.name !== undefined) payload.name = input.name;
    if (input.address !== undefined) payload.address = input.address;
    if (input.lat !== undefined) payload.lat = input.lat;
    if (input.lng !== undefined) payload.lng = input.lng;
    if (input.phone !== undefined) payload.phone = input.phone;
    if (input.whatsapp !== undefined) payload.whatsapp = input.whatsapp;
    if (input.maxRadiusKm !== undefined) payload.max_radius_km = input.maxRadiusKm;
    if (input.dailyCapacity !== undefined) payload.daily_capacity = input.dailyCapacity;
    if (input.isActive !== undefined) payload.is_active = input.isActive;
    if (input.isOpen !== undefined) payload.is_open = input.isOpen;
    if (input.notes !== undefined) payload.notes = input.notes;

    const { data, error } = await supabaseAdmin
      .from("hubs")
      .update(payload)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error || !data) {
      if (fallbackIdx !== -1) {
        return {
          success: true,
          hub: FALLBACK_HUBS[fallbackIdx],
        };
      }
      if (error) return { success: false, error: error.message };
    }

    return {
      success: true,
      hub: data
        ? {
            id: data.id,
            name: data.name,
            slug: data.slug,
            address: data.address,
            lat: Number(data.lat),
            lng: Number(data.lng),
            phone: data.phone,
            whatsapp: data.whatsapp,
            maxRadiusKm: Number(data.max_radius_km),
            dailyCapacity: Number(data.daily_capacity),
            isActive: data.is_active,
            isOpen: data.is_open,
            notes: data.notes,
          }
        : (fallbackIdx !== -1 ? FALLBACK_HUBS[fallbackIdx] : undefined),
    };
  } catch (err: any) {
    const fallbackIdx = FALLBACK_HUBS.findIndex((h) => h.id === id);
    if (fallbackIdx !== -1) {
      return { success: true, hub: FALLBACK_HUBS[fallbackIdx] };
    }
    return { success: false, error: err.message };
  }
}

export async function deleteHub(id: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.from("hubs").delete().eq("id", id);
    return !error;
  } catch {
    return false;
  }
}
