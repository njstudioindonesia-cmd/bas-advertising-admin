import { supabaseAdmin } from "@/lib/supabase/admin";

export interface ShippingTariff {
  id: string;
  hubId: string;
  baseFee: number;
  perKm: number;
  minFee: number;
  maxKm: number;
  freeOver?: number | null;
  isActive: boolean;
}

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
      const { data } = await supabaseAdmin
        .from("shipping_tariffs")
        .update(payload)
        .eq("id", input.id)
        .select()
        .maybeSingle();
      resultData = data;
    } else {
      const { data } = await supabaseAdmin
        .from("shipping_tariffs")
        .insert(payload)
        .select()
        .maybeSingle();
      resultData = data;
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
