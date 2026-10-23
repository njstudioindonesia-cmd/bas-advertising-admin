import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { DatabaseSync } from "node:sqlite";

// Deteksi lingkungan Vercel serverless (di mana filesystem /var/task read-only)
const isVercel = Boolean(process.env.VERCEL);
const DB_DIR = isVercel ? path.join("/tmp", "bas-data") : path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "app.db");

// Inisialisasi folder data jika belum ada
try {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
} catch (e) {
  console.warn("[DB] Tidak dapat membuat direktori data lokal:", e);
}

// Inisialisasi singleton SQLite Database
declare global {
  // eslint-disable-next-line no-var
  var __sqlite_db__: DatabaseSync | undefined;
}

function getDatabase(): DatabaseSync {
  if (!global.__sqlite_db__) {
    // Pada Vercel, jika database belum ada di /tmp, coba salin dari bundle jika ada
    if (isVercel && !fs.existsSync(DB_PATH)) {
      try {
        const bundledDb = path.join(process.cwd(), "data", "app.db");
        if (fs.existsSync(bundledDb)) {
          fs.copyFileSync(bundledDb, DB_PATH);
        }
      } catch {
        // Abaikan jika tidak ada file bundle
      }
    }

    const db = new DatabaseSync(DB_PATH);
    
    // Konfigurasi performa & integritas data
    try {
      db.exec("PRAGMA journal_mode = WAL;");
      db.exec("PRAGMA foreign_keys = ON;");
      db.exec("PRAGMA synchronous = NORMAL;");
    } catch {
      // Abaikan jika PRAGMA WAL tidak didukung di filesystem tertentu
    }

    // Inisialisasi Skema Tabel
    initSchema(db);

    // Auto-seed jika database masih kosong (kritis untuk deploy pertama di Vercel/Cloud)
    autoSeedIfEmpty(db);

    global.__sqlite_db__ = db;
  }
  return global.__sqlite_db__;
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    -- 1. Kategori Produk
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      icon TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- 2. Produk
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
      name TEXT NOT NULL,
      description TEXT,
      price INTEGER NOT NULL,
      compare_at_price INTEGER,
      unit TEXT DEFAULT '/ pcs',
      image_url TEXT NOT NULL,
      gallery TEXT,
      specs TEXT,
      is_best_seller INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      rating TEXT DEFAULT '5.0',
      sold TEXT DEFAULT '0',
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_active_sort ON products(is_active, sort_order);
    CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

    -- 3. Banner Carousel
    CREATE TABLE IF NOT EXISTS banners (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subtitle TEXT,
      image_url TEXT NOT NULL,
      cta_label TEXT,
      cta_href TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );

    -- 4. Pengaturan Situs (Key-Value Fleksibel)
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- 5. Portofolio Proyek
    CREATE TABLE IF NOT EXISTS portfolio (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      client TEXT,
      category TEXT,
      image_url TEXT NOT NULL,
      description TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );

    -- 6. Halaman Statis (About, Hubungi)
    CREATE TABLE IF NOT EXISTS pages (
      slug TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- 7. Pesanan (Orders)
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      delivery_method TEXT NOT NULL,
      address TEXT,
      payment_method TEXT NOT NULL,
      note TEXT,
      subtotal INTEGER NOT NULL,
      status TEXT DEFAULT 'BARU',
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);

    -- 8. Rincian Barang Pesanan (Snapshot)
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
      name_snapshot TEXT NOT NULL,
      price_snapshot INTEGER NOT NULL,
      unit_snapshot TEXT,
      qty INTEGER NOT NULL,
      design_note TEXT
    );

    -- 9. Admin Users
    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    -- 10. Admin Sessions
    CREATE TABLE IF NOT EXISTS admin_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );

    -- 11. Audit Log
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      actor TEXT NOT NULL,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id TEXT,
      diff TEXT,
      created_at TEXT NOT NULL
    );
  `);
}

function autoSeedIfEmpty(db: DatabaseSync) {
  try {
    const prodCount = db.prepare("SELECT COUNT(*) as count FROM products").get() as any;
    if (prodCount && Number(prodCount.count) > 0) {
      return; // Database sudah berisi data, lewati auto-seeding
    }

    const now = new Date().toISOString();

    // 1. Seed Admin User
    const adminCount = db.prepare("SELECT COUNT(*) as count FROM admin_users").get() as any;
    if (!adminCount || adminCount.count === 0) {
      const salt = crypto.randomBytes(16).toString("hex");
      const defaultPass = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV !== "production" ? "UrangDalamBAS2026!#" : crypto.randomBytes(24).toString("hex"));
      const derivedKey = crypto.scryptSync(defaultPass, salt, 64);
      const hash = `${salt}:${derivedKey.toString("hex")}`;
      db.prepare("INSERT INTO admin_users VALUES (?, ?, ?, ?)").run("admin-root", process.env.ADMIN_USERNAME || "admin", hash, now);
    }

    // 2. Seed Categories
    const CATEGORY_MAP: Record<string, any> = {
      "Branding Outlet": { id: "cat-outlet", name: "Branding Outlet", slug: "branding-outlet", icon: "Store", sortOrder: 1 },
      "Branding Meja": { id: "cat-meja", name: "Branding Meja", slug: "branding-meja", icon: "Utensils", sortOrder: 2 },
      "Packaging": { id: "cat-packaging", name: "Packaging", slug: "packaging", icon: "Package", sortOrder: 3 },
      "Crew": { id: "cat-crew", name: "Crew", slug: "crew", icon: "Shirt", sortOrder: 4 },
      "Marketing": { id: "cat-marketing", name: "Marketing", slug: "marketing", icon: "Megaphone", sortOrder: 5 },
      "Barang Cetak Pendukung": { id: "cat-pendukung", name: "Barang Cetak Pendukung", slug: "barang-cetak-pendukung", icon: "FileText", sortOrder: 6 },
      "Merchandise": { id: "cat-merchandise", name: "Merchandise", slug: "merchandise", icon: "Gift", sortOrder: 7 },
      "Outdoor & Signage": { id: "cat-outdoor", name: "Outdoor & Signage", slug: "outdoor-signage", icon: "Signpost", sortOrder: 8 },
    };

    const catStmt = db.prepare(`
      INSERT INTO categories (id, slug, name, icon, sort_order, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?)
      ON CONFLICT(id) DO UPDATE SET name = excluded.name, slug = excluded.slug, sort_order = excluded.sort_order
    `);

    for (const c of Object.values(CATEGORY_MAP)) {
      catStmt.run(c.id, c.slug, c.name, c.icon, c.sortOrder, now, now);
    }

    // 3. Seed Products from src/data/products.json
    const jsonPath = path.join(process.cwd(), "src", "data", "products.json");
    if (fs.existsSync(jsonPath)) {
      const rawData = fs.readFileSync(jsonPath, "utf-8");
      const products = JSON.parse(rawData);

      const prodStmt = db.prepare(`
        INSERT INTO products (
          id, slug, category_id, name, description, price, compare_at_price,
          unit, image_url, gallery, specs, is_best_seller, is_active,
          rating, sold, sort_order, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO NOTHING
      `);

      let pIdx = 0;
      for (const p of products) {
        pIdx++;
        const cat = CATEGORY_MAP[p.category] || CATEGORY_MAP["Branding Outlet"];
        const priceDigits = String(p.price || "").replace(/[^0-9]/g, "");
        const priceInt = parseInt(priceDigits, 10) || 0;
        const compareDigits = p.normalPrice ? String(p.normalPrice).replace(/[^0-9]/g, "") : "";
        const compareAtInt = compareDigits ? parseInt(compareDigits, 10) : null;
        const slug = p.id;

        prodStmt.run(
          p.id,
          slug,
          cat.id,
          p.title,
          p.desc || "",
          priceInt,
          compareAtInt,
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
    }

    // 4. Seed Settings
    const defaultSettings: Record<string, any> = {
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
        { id: "Transfer Bank", name: "Transfer Bank", enabled: true, details: "BCA 1234-567-890 a/n BAS Advertising" },
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

    const settingStmt = db.prepare(`
      INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `);

    for (const [k, v] of Object.entries(defaultSettings)) {
      settingStmt.run(k, JSON.stringify(v), now);
    }

    // 5. Seed Banners
    const bannerStmt = db.prepare(`
      INSERT INTO banners (id, title, subtitle, image_url, cta_label, cta_href, sort_order, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
      ON CONFLICT(id) DO NOTHING
    `);
    bannerStmt.run("ban-1", "Branding Cafe & Resto", "Diskon Spesial 25% untuk Paket Lengkap Branding", "https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?q=80&w=1600&auto=format&fit=crop", "Pesan Sekarang", "/produk?category=Packaging", 1, now);
    bannerStmt.run("ban-2", "Cetak Spanduk & Banner Kilat", "Bahan Flexi Korea High Resolution Anti Pudar - Selesai 24 Jam", "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=1200&auto=format&fit=crop", "Cetak Kilat", "/produk?q=Banner", 2, now);
    bannerStmt.run("ban-3", "Studio Mockup Visualisasi 3D", "Lihat Hasil Desain Nyata Cup, Totebag & Kaos Sebelum Dicetak", "https://images.unsplash.com/photo-1530587191325-3db32d826c18?q=80&w=1200&auto=format&fit=crop", "Buka Studio 3D", "/mockup", 3, now);

    // 6. Seed Portfolio
    const portStmt = db.prepare(`
      INSERT INTO portfolio (id, title, client, category, image_url, description, sort_order, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
      ON CONFLICT(id) DO NOTHING
    `);
    portStmt.run("port-1", "Packaging Kopi Eksklusif", "Coffee & Cafe Packaging Collection", "Packaging", "https://images.unsplash.com/photo-1530587191325-3db32d826c18?q=80&w=1200&auto=format&fit=crop", "Coffee Packaging Collection", 1, now);
    portStmt.run("port-2", "Signage & Wayfinding Outlet", "Outlet Signage & Wayfinding Display", "Signage", "https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=1200&auto=format&fit=crop", "Outlet Signage", 2, now);
    portStmt.run("port-3", "Corporate Stationery & Map", "Corporate Stationery & Map Collection", "Print", "https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=1200&auto=format&fit=crop", "Stationery", 3, now);

    // 7. Seed Pages
    const pageStmt = db.prepare(`
      INSERT INTO pages (slug, title, content, updated_at) VALUES (?, ?, ?, ?)
      ON CONFLICT(slug) DO NOTHING
    `);
    pageStmt.run("about", "Crafting Visual Excellence", JSON.stringify({
      tagline: "Our Story",
      heading: "Crafting Visual Excellence.",
      description: "We are more than just a printing service. We are a dedicated studio committed to bringing your brand's physical presence to the highest standard."
    }), now);
    pageStmt.run("hubungi", "Let's Create Something Great", JSON.stringify({
      heading: "Let's create something great.",
      description: "Whether you have a fully formed project or just a rough idea, our team is ready to bring it to life with precision and care.",
      address: "Jl. Percetakan Modern No.88, Kota Padang, Sumatera Barat",
      phone: "+62 812 3456 7890",
      email: "hello@basadvertising.com"
    }), now);

    console.log("[AUTO-SEED] Database berhasil di-seed secara otomatis saat startup!");
  } catch (err) {
    console.error("[AUTO-SEED ERROR]", err);
  }
}

export const db = getDatabase();
export default db;
