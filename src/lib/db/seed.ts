import { db } from "./client";
import { products as defaultProducts } from "@/data/products";
import { ensureInitialAdminUser } from "../auth/session";
import { DEFAULT_SETTINGS, setMultipleSettings } from "./queries/settings";

function parsePriceToInteger(priceStr?: string): number {
  if (!priceStr) return 0;
  const digits = priceStr.replace(/[^0-9]/g, "");
  return parseInt(digits, 10) || 0;
}

const CATEGORY_MAP: Record<string, { id: string; name: string; slug: string; icon: string; sortOrder: number }> = {
  "Branding Outlet": { id: "cat-outlet", name: "Branding Outlet", slug: "branding-outlet", icon: "Store", sortOrder: 1 },
  "Branding Meja": { id: "cat-meja", name: "Branding Meja", slug: "branding-meja", icon: "Utensils", sortOrder: 2 },
  "Packaging": { id: "cat-packaging", name: "Packaging", slug: "packaging", icon: "Package", sortOrder: 3 },
  "Crew": { id: "cat-crew", name: "Crew", slug: "crew", icon: "Shirt", sortOrder: 4 },
  "Marketing": { id: "cat-marketing", name: "Marketing", slug: "marketing", icon: "Megaphone", sortOrder: 5 },
  "Barang Cetak Pendukung": { id: "cat-pendukung", name: "Barang Cetak Pendukung", slug: "barang-cetak-pendukung", icon: "FileText", sortOrder: 6 },
  "Merchandise": { id: "cat-merchandise", name: "Merchandise", slug: "merchandise", icon: "Gift", sortOrder: 7 },
  "Outdoor & Signage": { id: "cat-outdoor", name: "Outdoor & Signage", slug: "outdoor-signage", icon: "Signpost", sortOrder: 8 },
};

export function seedDatabase(): { categoriesCount: number; productsCount: number } {
  console.log("[SEED] Memulai sinkronisasi database...");
  const now = new Date().toISOString();

  // 1. Seed Admin User
  ensureInitialAdminUser();

  // 2. Seed Default Settings
  setMultipleSettings(DEFAULT_SETTINGS);

  // 3. Seed Categories
  const catStmt = db.prepare(`
    INSERT INTO categories (id, slug, name, icon, sort_order, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?)
    ON CONFLICT(id) DO UPDATE SET 
      name = excluded.name, 
      slug = excluded.slug, 
      icon = excluded.icon, 
      sort_order = excluded.sort_order,
      updated_at = excluded.updated_at
  `);

  for (const cat of Object.values(CATEGORY_MAP)) {
    catStmt.run(cat.id, cat.slug, cat.name, cat.icon, cat.sortOrder, now, now);
  }

  // 4. Seed Products
  const prodStmt = db.prepare(`
    INSERT INTO products (
      id, slug, category_id, name, description, price, compare_at_price,
      unit, image_url, gallery, specs, is_best_seller, is_active,
      rating, sold, sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      slug = excluded.slug,
      category_id = excluded.category_id,
      description = excluded.description,
      price = excluded.price,
      compare_at_price = excluded.compare_at_price,
      unit = excluded.unit,
      image_url = excluded.image_url,
      gallery = excluded.gallery,
      specs = excluded.specs,
      is_best_seller = excluded.is_best_seller,
      rating = excluded.rating,
      sold = excluded.sold,
      sort_order = excluded.sort_order,
      updated_at = excluded.updated_at
  `);

  let pIdx = 0;
  for (const p of defaultProducts) {
    pIdx++;
    const catConfig = CATEGORY_MAP[p.category] || CATEGORY_MAP["Branding Outlet"];
    const priceNum = parsePriceToInteger(p.price);
    const compareAtNum = p.normalPrice ? parsePriceToInteger(p.normalPrice) : null;
    const slug = p.id;

    prodStmt.run(
      p.id,
      slug,
      catConfig.id,
      p.title,
      p.desc || "",
      priceNum,
      compareAtNum,
      p.unit || "/ pcs",
      p.img,
      JSON.stringify(p.images || [p.img]),
      JSON.stringify(p.specs || []),
      p.isBestSeller ? 1 : 0,
      1,
      p.rating || "5.0",
      p.sold || "0",
      pIdx,
      now,
      now
    );
  }

  // 5. Seed Banners
  const existingBanners = db.prepare("SELECT COUNT(*) as count FROM banners").get() as any;
  if (!existingBanners || existingBanners.count === 0) {
    const bannerStmt = db.prepare(`
      INSERT INTO banners (id, title, subtitle, image_url, cta_label, cta_href, sort_order, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);

    bannerStmt.run(
      "ban-1",
      "Branding Cafe & Resto",
      "Diskon Spesial 25% untuk Paket Lengkap Branding",
      "https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?q=80&w=1600&auto=format&fit=crop",
      "Pesan Sekarang",
      "/produk?category=Packaging",
      1,
      now
    );
    bannerStmt.run(
      "ban-2",
      "Cetak Spanduk & Banner Kilat",
      "Bahan Flexi Korea High Resolution Anti Pudar - Selesai 24 Jam",
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=1200&auto=format&fit=crop",
      "Cetak Kilat",
      "/produk?q=Banner",
      2,
      now
    );
    bannerStmt.run(
      "ban-3",
      "Studio Mockup Visualisasi 3D",
      "Lihat Hasil Desain Nyata Cup, Totebag & Kaos Sebelum Dicetak",
      "https://images.unsplash.com/photo-1530587191325-3db32d826c18?q=80&w=1200&auto=format&fit=crop",
      "Buka Studio 3D",
      "/mockup",
      3,
      now
    );
  }

  // 6. Seed Portfolio
  const existingPort = db.prepare("SELECT COUNT(*) as count FROM portfolio").get() as any;
  if (!existingPort || existingPort.count === 0) {
    const portStmt = db.prepare(`
      INSERT INTO portfolio (id, title, client, category, image_url, description, sort_order, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);

    const defaultPort = [
      { id: "port-1", title: "Packaging Kopi Eksklusif", client: "Coffee & Cafe Packaging Collection", category: "Packaging", img: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?q=80&w=1200&auto=format&fit=crop" },
      { id: "port-2", title: "Signage & Wayfinding Outlet", client: "Outlet Signage & Wayfinding Display", category: "Signage", img: "https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=1200&auto=format&fit=crop" },
      { id: "port-3", title: "Corporate Stationery & Map", client: "Corporate Stationery & Map Collection", category: "Print", img: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=1200&auto=format&fit=crop" },
      { id: "port-4", title: "Dragon Cup Series Hot & Cold", client: "Dragon Cup Series Hot & Cold", category: "Packaging", img: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=1200&auto=format&fit=crop" },
      { id: "port-5", title: "Neon Box & Interior Cafe", client: "Neon Box & Interior Cafe Display", category: "Signage", img: "https://images.unsplash.com/photo-1531973576160-7125cd663d86?q=80&w=1200&auto=format&fit=crop" }
    ];

    let pCount = 0;
    for (const item of defaultPort) {
      pCount++;
      portStmt.run(item.id, item.title, item.client, item.category, item.img, item.client, pCount, now);
    }
  }

  // 7. Seed Pages (About & Hubungi)
  const existingPages = db.prepare("SELECT COUNT(*) as count FROM pages").get() as any;
  if (!existingPages || existingPages.count === 0) {
    const pageStmt = db.prepare(`
      INSERT INTO pages (slug, title, content, updated_at)
      VALUES (?, ?, ?, ?)
    `);

    pageStmt.run(
      "about",
      "Crafting Visual Excellence",
      JSON.stringify({
        tagline: "Our Story",
        heading: "Crafting Visual Excellence.",
        description: "We are more than just a printing service. We are a dedicated studio committed to bringing your brand's physical presence to the highest standard.",
        features: [
          "Mesin Cetak Berteknologi Tinggi (UV & Eco-Solvent)",
          "Bahan Pilihan Kualitas Industri",
          "Tim Desain & Produksi Berpengalaman",
          "Garansi Warna & Ketepatan Deadline"
        ]
      }),
      now
    );

    pageStmt.run(
      "hubungi",
      "Let's Create Something Great",
      JSON.stringify({
        heading: "Let's create something great.",
        description: "Whether you have a fully formed project or just a rough idea, our team is ready to bring it to life with precision and care.",
        address: "Jl. Percetakan Modern No.88, Kota Padang, Sumatera Barat",
        phone: "+62 812 3456 7890",
        email: "hello@basadvertising.com",
        hours: "Senin - Sabtu: 08:30 - 21:00 WIB"
      }),
      now
    );
  }

  const finalCatCount = db.prepare("SELECT COUNT(*) as count FROM categories").get() as any;
  const finalProdCount = db.prepare("SELECT COUNT(*) as count FROM products").get() as any;

  console.log(`[SEED] Berhasil mengimpor ${finalCatCount.count} Kategori dan ${finalProdCount.count} Produk ke database SQLite!`);
  return {
    categoriesCount: finalCatCount.count,
    productsCount: finalProdCount.count
  };
}

// Auto-seed bila dijalankan langsung lewat CLI: node seed.js
if (require.main === module) {
  seedDatabase();
}
