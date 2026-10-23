import { supabaseAdmin } from "@/lib/supabase/admin";

export const DEFAULT_SETTINGS: Record<string, any> = {
  "site.name": "Cetak.inc",
  "site.tagline": "Modern Printing & Advertising Studio",
  "site.description": "Premium printing & advertising studio delivering precision and perfection.",
  "contact.whatsapp": "6281234567890",
  "contact.email": "hello@basadvertising.com",
  "contact.address": "Jl. Percetakan Modern No.88, Kota Padang, Sumatera Barat",
  "contact.hours": "Senin - Sabtu: 08:30 - 21:00 WIB",
  "location.chipLabel": "Kota Padang & Sekitarnya",
  "social.instagram": "@basadvertising",
  "social.tiktok": "@basadvpadang",
  "checkout.paymentMethods": [
    { id: "QRIS", name: "QRIS Instant", enabled: true, details: "Scan QRIS via GoPay, OVO, Dana, BCA, Livin" },
    { id: "Transfer Bank", name: "Transfer Bank", enabled: true, details: "BCA / Mandiri / BNI a/n Cetak.inc" },
    { id: "COD / Kasir", name: "Bayar di Workshop / Kasir", enabled: true, details: "Pembayaran langsung saat ambil pesanan" }
  ],
  "checkout.deliveryMethods": [
    { id: "kirim", name: "Kirim ke Alamat", enabled: true, note: "Kurir lokal Padang & Ekspedisi" },
    { id: "pickup", name: "Ambil di Toko / Workshop", enabled: true, note: "Gratis tanpa ongkir" }
  ],
  "checkout.waTemplate": "*HALO CETAK.INC, SAYA INGIN PESAN:*\n----------------------------------------\n*No. Pesanan:* {code}\n*Nama:* {nama}\n*WhatsApp:* {phone}\n*Metode:* {metode}\n*Alamat:* {alamat}\n*Pembayaran:* {pembayaran}\n*Catatan:* {catatan}\n----------------------------------------\n*RINCIAN PESANAN:*\n{items}\n----------------------------------------\n*TOTAL:* *{total}*\n----------------------------------------\nMohon diproses, terima kasih!",
  "home.promoTitle": "Diskon 25% Hari Ini",
  "home.promoSubtitle": "Spesial Branding Cafe, Resto & Bisnis",
};

export async function getSettings(): Promise<Record<string, any>> {
  try {
    const { data, error } = await supabaseAdmin.from("settings").select("key, value");
    const result = { ...DEFAULT_SETTINGS };

    if (!error && Array.isArray(data)) {
      for (const row of data) {
        result[row.key] = row.value;
      }
    }

    return result;
  } catch (err: any) {
    console.error("[SUPABASE_ERR] Error getSettings:", err);
    return { ...DEFAULT_SETTINGS };
  }
}

export async function getSetting<T = any>(key: string, defaultValue?: T): Promise<T> {
  try {
    const { data, error } = await supabaseAdmin
      .from("settings")
      .select("value")
      .eq("key", key)
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return (defaultValue !== undefined ? defaultValue : DEFAULT_SETTINGS[key]) as T;
    }

    return data.value as T;
  } catch {
    return (defaultValue !== undefined ? defaultValue : DEFAULT_SETTINGS[key]) as T;
  }
}

export async function setSetting(key: string, value: any): Promise<void> {
  const now = new Date().toISOString();
  await supabaseAdmin.from("settings").upsert({
    key,
    value,
    updated_at: now,
  });
}

export async function setMultipleSettings(entries: Record<string, any>): Promise<void> {
  const now = new Date().toISOString();
  const rows = Object.entries(entries).map(([key, value]) => ({
    key,
    value,
    updated_at: now,
  }));

  const { error } = await supabaseAdmin.from("settings").upsert(rows);
  if (error) {
    throw new Error(error.message);
  }
}
