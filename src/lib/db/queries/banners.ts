import { supabaseAdmin } from "@/lib/supabase/admin";
import { BannerInput } from "@/lib/validators";

export interface BannerRecord {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  ctaLabel: string | null;
  ctaHref: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

const DEFAULT_FALLBACK_BANNERS: BannerRecord[] = [
  {
    id: "ban-default-1",
    title: "Cetak Cepat, Presisi & Bergaransi",
    subtitle: "Solusi branding & percetakan advertising terlengkap untuk bisnis Anda.",
    imageUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop",
    ctaLabel: "Lihat Katalog",
    ctaHref: "/produk",
    sortOrder: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "ban-default-2",
    title: "Promo Cetak Spanduk & Banner Kilat",
    subtitle: "Cetak outdoor & indoor kualitas tinggi dengan mesin terbaru.",
    imageUrl: "https://images.unsplash.com/photo-1542744094-3a31f272c490?q=80&w=1200&auto=format&fit=crop",
    ctaLabel: "Pesan Sekarang",
    ctaHref: "/produk",
    sortOrder: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

export async function getBanners(includeInactive = false): Promise<BannerRecord[]> {
  try {
    let query = supabaseAdmin
      .from("banners")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data.map((r: any) => ({
        id: r.id,
        title: r.title,
        subtitle: r.subtitle,
        imageUrl: r.image_url,
        ctaLabel: r.cta_label,
        ctaHref: r.cta_href,
        sortOrder: Number(r.sort_order) || 0,
        isActive: Boolean(r.is_active),
        createdAt: r.created_at,
      }));
    }
  } catch (err: any) {
    console.warn("[SUPABASE_OFFLINE] Menggunakan fallback banner lokal");
  }

  return includeInactive
    ? DEFAULT_FALLBACK_BANNERS
    : DEFAULT_FALLBACK_BANNERS.filter((b) => b.isActive);
}

export async function getBannerById(id: string): Promise<BannerRecord | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("banners")
      .select("*")
      .eq("id", id)
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return {
        id: data.id,
        title: data.title,
        subtitle: data.subtitle,
        imageUrl: data.image_url,
        ctaLabel: data.cta_label,
        ctaHref: data.cta_href,
        sortOrder: Number(data.sort_order) || 0,
        isActive: Boolean(data.is_active),
        createdAt: data.created_at,
      };
    }
  } catch {
    // offline fallback
  }

  return DEFAULT_FALLBACK_BANNERS.find((b) => b.id === id) || null;
}

export async function createBanner(input: BannerInput): Promise<BannerRecord> {
  const id = input.id || "ban-" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  const now = new Date().toISOString();

  const payload = {
    id,
    title: input.title,
    subtitle: input.subtitle || null,
    image_url: input.imageUrl,
    cta_label: input.ctaLabel || "Pesan Sekarang",
    cta_href: input.ctaHref || "/produk",
    sort_order: input.sortOrder || 0,
    is_active: input.isActive !== undefined ? Boolean(input.isActive) : true,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabaseAdmin
    .from("banners")
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Gagal membuat banner di Supabase");
  }

  return {
    id: data.id,
    title: data.title,
    subtitle: data.subtitle,
    imageUrl: data.image_url,
    ctaLabel: data.cta_label,
    ctaHref: data.cta_href,
    sortOrder: Number(data.sort_order) || 0,
    isActive: Boolean(data.is_active),
    createdAt: data.created_at,
  };
}

export async function updateBanner(
  id: string,
  input: Partial<BannerInput>
): Promise<BannerRecord | null> {
  const existing = await getBannerById(id);
  if (!existing) return null;

  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (input.title !== undefined) updates.title = input.title;
  if (input.subtitle !== undefined) updates.subtitle = input.subtitle;
  if (input.imageUrl !== undefined) updates.image_url = input.imageUrl;
  if (input.ctaLabel !== undefined) updates.cta_label = input.ctaLabel;
  if (input.ctaHref !== undefined) updates.cta_href = input.ctaHref;
  if (input.sortOrder !== undefined) updates.sort_order = input.sortOrder;
  if (input.isActive !== undefined) updates.is_active = Boolean(input.isActive);

  const { data, error } = await supabaseAdmin
    .from("banners")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Gagal memperbarui banner di Supabase");
  }

  return {
    id: data.id,
    title: data.title,
    subtitle: data.subtitle,
    imageUrl: data.image_url,
    ctaLabel: data.cta_label,
    ctaHref: data.cta_href,
    sortOrder: Number(data.sort_order) || 0,
    isActive: Boolean(data.is_active),
    createdAt: data.created_at,
  };
}

export async function deleteBanner(id: string): Promise<boolean> {
  const { error } = await supabaseAdmin.from("banners").delete().eq("id", id);
  return !error;
}
