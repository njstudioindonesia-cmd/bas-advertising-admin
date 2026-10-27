/**
 * Trigger On-Demand Revalidation pada Web Utama (https://cetakinc.vercel.app)
 * Memastikan setiap aksi CRUD produk di admin langsung membersihkan cache di toko pembeli secara instan (0 detik).
 */
export function triggerRemoteStoreRevalidation() {
  const storeUrl = process.env.NEXT_PUBLIC_STORE_URL || "https://cetakinc.vercel.app";
  const secret = process.env.REVALIDATE_SECRET || "bas_adv_revalidate_secret_padang_2026";
  try {
    fetch(`${storeUrl}/api/revalidate?secret=${encodeURIComponent(secret)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }).catch(() => {});
  } catch {
    // Abaikan jika offline / koneksi terputus
  }
}
