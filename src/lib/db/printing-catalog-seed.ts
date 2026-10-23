import { supabaseAdmin } from "@/lib/supabase/admin";

export const PRINTING_CATEGORIES = [
  {
    id: "cat-spanduk-banner",
    slug: "spanduk-banner",
    name: "Spanduk & Banner",
    icon: "Printer",
    sort_order: 1,
    is_active: true,
  },
  {
    id: "cat-stiker-label",
    slug: "stiker-label",
    name: "Stiker & Label Kemasan",
    icon: "Layers",
    sort_order: 2,
    is_active: true,
  },
  {
    id: "cat-media-promosi",
    slug: "media-promosi-kantor",
    name: "Media Promosi & Kantor",
    icon: "FileText",
    sort_order: 3,
    is_active: true,
  },
  {
    id: "cat-merchandise-sablon",
    slug: "merchandise-sablon",
    name: "Merchandise & Sablon",
    icon: "Shirt",
    sort_order: 4,
    is_active: true,
  },
  {
    id: "cat-signage-akrilik",
    slug: "signage-akrilik",
    name: "Signage & Akrilik",
    icon: "Sparkles",
    sort_order: 5,
    is_active: true,
  },
];

export const PRINTING_PRODUCTS = [
  // 1. Spanduk & Banner
  {
    id: "prod-spanduk-flexi-280",
    slug: "spanduk-flexi-china-280g",
    category_id: "cat-spanduk-banner",
    name: "Spanduk Flexi China 280g (Outdoor)",
    description: "Bahan spanduk standar outdoor paling populer untuk spanduk warung kuliner, baliho event, dan spanduk promosi kilat. Tahan panas dan hujan, warna tajam beresolusi tinggi.",
    price: 25000,
    compare_at_price: 30000,
    unit: "/ meter",
    image_url: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=800&auto=format&fit=crop",
    gallery: JSON.stringify([
      "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop"
    ]),
    specs: JSON.stringify([
      "Bahan Flexi China 280 GSM",
      "Format Hitung P x L Otomatis",
      "Finishing Mata Ayam 4 Sudut Gratis",
      "Tinta Solvent Tahan Cuaca Panas & Hujan",
      "Estimasi Pengerjaan 3 - 6 Jam (Same Day)"
    ]),
    is_best_seller: true,
    is_active: true,
    rating: "5.0",
    sold: "1.4k+",
    sort_order: 1,
  },
  {
    id: "prod-spanduk-korea-440",
    slug: "spanduk-flexi-korea-440g",
    category_id: "cat-spanduk-banner",
    name: "Spanduk Flexi Korea 440g (Higres Tebal)",
    description: "Bahan spanduk premium heavy-duty dengan permukaan matte halus dan serat rapat. Tahan cuaca ekstrem lebih dari 1 tahun tanpa luntur atau robek. Pilihan utama instansi dan brand corporate.",
    price: 45000,
    compare_at_price: 55000,
    unit: "/ meter",
    image_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop",
    gallery: JSON.stringify([
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop"
    ]),
    specs: JSON.stringify([
      "Bahan Flexi Korea 440 GSM Tebal",
      "Tekstur Halus Doff Tidak Memantulkan Cahaya",
      "Tahan Cuaca > 12 Bulan",
      "Finishing Lipat Rapi & Mata Ayam Keliling",
      "Kualitas Cetak Tajam High Resolution"
    ]),
    is_best_seller: false,
    is_active: true,
    rating: "4.9",
    sold: "620+",
    sort_order: 2,
  },
  {
    id: "prod-x-banner-60x160",
    slug: "x-banner-stand-60x160",
    category_id: "cat-spanduk-banner",
    name: "X-Banner Stand 60x160cm (Komplit Rangka)",
    description: "Paket lengkap display banner promosi toko, booth pameran, dan resepsionis kantor. Sudah termasuk cetak bahan Albatros tahan air dengan laminasi pelindung anti gores serta rangka X fiber kokoh.",
    price: 85000,
    compare_at_price: 100000,
    unit: "/ set",
    image_url: "https://images.unsplash.com/photo-1588702547923-7093a6c3ba33?q=80&w=800&auto=format&fit=crop",
    gallery: JSON.stringify([
      "https://images.unsplash.com/photo-1588702547923-7093a6c3ba33?q=80&w=800&auto=format&fit=crop"
    ]),
    specs: JSON.stringify([
      "Ukuran Standar 60 x 160 cm",
      "Bahan Cetak Albatros Halus (Bukan Banner Kasar)",
      "Laminasi Doff atau Glossy Bebas Pilih",
      "Sudah Termasuk Rangka Kaki X Fiber & Sarung Spunbond",
      "Ringan & Praktis Dibawa Pameran"
    ]),
    is_best_seller: true,
    is_active: true,
    rating: "5.0",
    sold: "950+",
    sort_order: 3,
  },
  {
    id: "prod-rollup-banner-85x200",
    slug: "roll-up-banner-85x200",
    category_id: "cat-spanduk-banner",
    name: "Roll Up Banner Aluminium Luxury 85x200cm",
    description: "Display standing banner eksklusif dengan mekanisme gulung otomatis bodi aluminium tebal. Tidak mudah roboh, sangat mewah untuk lobby hotel, kantor bank, dan booth pameran mall.",
    price: 220000,
    compare_at_price: 260000,
    unit: "/ set",
    image_url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=800&auto=format&fit=crop",
    gallery: JSON.stringify([
      "https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=800&auto=format&fit=crop"
    ]),
    specs: JSON.stringify([
      "Ukuran 85 x 200 cm (Jumbo)",
      "Rangka Bodi Aluminium Solid Kokoh",
      "Mekanisme Tarik & Gulung Otomatis Anti Kusut",
      "Bahan Albatros + Laminasi Doff Mewah",
      "Termasuk Tas Kanvas Jinjing Premium"
    ]),
    is_best_seller: false,
    is_active: true,
    rating: "4.9",
    sold: "380+",
    sort_order: 4,
  },

  // 2. Stiker & Label Kemasan
  {
    id: "prod-stiker-vinyl-a3",
    slug: "stiker-vinyl-waterproof-a3",
    category_id: "cat-stiker-label",
    name: "Stiker Vinyl Waterproof A3+ (Sudah Cutting)",
    description: "Label stiker plastik waterproof anti robek dan tahan beku/minyak. Sangat direkomendasikan untuk produk botol kopi susu, sambal kemasan, minuman boba, dan frozen food UMKM. Sudah termasuk kiss-cut potong sesuai bentuk pola.",
    price: 18000,
    compare_at_price: 22000,
    unit: "/ lembar",
    image_url: "https://images.unsplash.com/photo-1572375992501-4b0892d50c69?q=80&w=800&auto=format&fit=crop",
    gallery: JSON.stringify([
      "https://images.unsplash.com/photo-1572375992501-4b0892d50c69?q=80&w=800&auto=format&fit=crop"
    ]),
    specs: JSON.stringify([
      "Area Cetak Lembar A3+ (31 x 47 cm)",
      "Bahan Plastik Vinyl Waterproof (Putih Susu)",
      "Sudah Termasuk Potong Kiss-Cut Sesuai Pola Desain",
      "Tinta Laser Fuji Xerox Tahan Gores & Air",
      "Isi puluhan hingga ratusan pcs stiker per lembar"
    ]),
    is_best_seller: true,
    is_active: true,
    rating: "5.0",
    sold: "3.2k+",
    sort_order: 5,
  },
  {
    id: "prod-stiker-chromo-a3",
    slug: "stiker-kromo-ekonomis-a3",
    category_id: "cat-stiker-label",
    name: "Stiker Kromo Glossy Ekonomis A3+ (Kiss-Cut)",
    description: "Solusi label kemasan hemat dengan permukaan mengkilap (glossy). Ideal untuk label toples kue kering, kotak catering, box packaging online shop, dan paper bag yang tidak terkena rendaman air.",
    price: 12000,
    compare_at_price: 15000,
    unit: "/ lembar",
    image_url: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?q=80&w=800&auto=format&fit=crop",
    gallery: JSON.stringify([
      "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?q=80&w=800&auto=format&fit=crop"
    ]),
    specs: JSON.stringify([
      "Area Cetak A3+ (31 x 47 cm)",
      "Bahan Kromo Glossy Berkilau",
      "Daya Rekat Lem Sangat Kuat pada Kardus & Plastik",
      "Sudah Kiss-Cut Siap Kelupas & Tempel",
      "Pilihan Paling Ekonomis untuk Usaha Rintisan"
    ]),
    is_best_seller: false,
    is_active: true,
    rating: "4.8",
    sold: "2.1k+",
    sort_order: 6,
  },
  {
    id: "prod-stiker-transparan-a3",
    slug: "stiker-transparan-a3",
    category_id: "cat-stiker-label",
    name: "Stiker Transparan Bening A3+ (Kiss-Cut)",
    description: "Stiker plastik bening tembus pandang yang memberikan kesan cetak langsung ke permukaan botol (no-label look). Tahan air dan minyak, sangat estetik untuk kemasan kosmetik, skincare, dan botol kaca premium.",
    price: 20000,
    compare_at_price: 25000,
    unit: "/ lembar",
    image_url: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=800&auto=format&fit=crop",
    gallery: JSON.stringify([
      "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=800&auto=format&fit=crop"
    ]),
    specs: JSON.stringify([
      "Area Cetak A3+ Bahan Bening Transparan",
      "Efek No-Label Look yang Elegan",
      "Waterproof & Tahan Minyak / Sabun",
      "Kiss-Cut Mesin Digital Presisi Tinggi",
      "Cocok untuk Skincare, Madu & Minuman Kekinian"
    ]),
    is_best_seller: false,
    is_active: true,
    rating: "4.9",
    sold: "890+",
    sort_order: 7,
  },

  // 3. Media Promosi & Kantor
  {
    id: "prod-kartu-nama-exclusive",
    slug: "kartu-nama-exclusive-2-sisi",
    category_id: "cat-media-promosi",
    name: "Kartu Nama Exclusive 2 Sisi (+Laminasi & Box)",
    description: "Cetak kartu nama profesional dengan kertas Art Carton 260g tebal, dicetak full color bolak-balik (2 sisi) dan dilapisi laminasi Doff halus atau Glossy kilap. Sudah termasuk kotak mika pelindung eksklusif isi 100 lembar.",
    price: 45000,
    compare_at_price: 55000,
    unit: "/ box",
    image_url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=800&auto=format&fit=crop",
    gallery: JSON.stringify([
      "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=800&auto=format&fit=crop"
    ]),
    specs: JSON.stringify([
      "Isi 100 Lembar per Box Mika Eksklusif",
      "Kertas Art Carton 260 GSM Tebal",
      "Cetak 2 Sisi Bolak-Balik Full Color",
      "Finishing Laminasi Doff Halus atau Glossy",
      "Potongan Presisi Standar 9 x 5.5 cm"
    ]),
    is_best_seller: true,
    is_active: true,
    rating: "5.0",
    sold: "1.8k+",
    sort_order: 8,
  },
  {
    id: "prod-brosur-artpaper-a5",
    slug: "brosur-promosi-art-paper-a5",
    category_id: "cat-media-promosi",
    name: "Brosur Promosi Art Paper 150g (A5 Full Color)",
    description: "Brosur promosi ukuran A5 (14.8 x 21 cm) berbahan Art Paper 150g yang licin mengkilap. Warna tajam memikat untuk selebaran promosi diskon perumahan, menu resto baru, dan pamflet seminar.",
    price: 175000,
    compare_at_price: 210000,
    unit: "/ rim",
    image_url: "https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=800&auto=format&fit=crop",
    gallery: JSON.stringify([
      "https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=800&auto=format&fit=crop"
    ]),
    specs: JSON.stringify([
      "Isi 500 Lembar (1 Rim) Ukuran A5",
      "Kertas Art Paper 150 GSM Mengkilap",
      "Cetak Offset / Digital Press High Fidelity",
      "Warna Tajam Tidak Mudah Pudar",
      "Pilihan 1 Sisi atau 2 Sisi"
    ]),
    is_best_seller: false,
    is_active: true,
    rating: "4.8",
    sold: "740+",
    sort_order: 9,
  },
  {
    id: "prod-nota-ncr-2ply",
    slug: "nota-ncr-2-rangkap",
    category_id: "cat-media-promosi",
    name: "Nota NCR 2 Rangkap (Tembus Tanpa Karbon)",
    description: "Buku nota faktur / kuitansi / surat jalan otomatis tembus tulisan tanpa perlu kertas karbon hitam lagi. Sudah termasuk cetak identitas toko, nomorator seri urut gratis, dan jilid perforasi sobek mudah.",
    price: 12000,
    compare_at_price: 15000,
    unit: "/ buku",
    image_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=800&auto=format&fit=crop",
    gallery: JSON.stringify([
      "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=800&auto=format&fit=crop"
    ]),
    specs: JSON.stringify([
      "Kertas NCR Top + Bottom (Putih & Merah/Kuning)",
      "Isi 50 Set (100 Lembar) per Buku",
      "Jilid Lem & Blok Jahit dengan Garis Perforasi",
      "Gratis Cetak Nomorator Berurutan (No. Seri)",
      "Minimal Order Terjangkau"
    ]),
    is_best_seller: true,
    is_active: true,
    rating: "4.9",
    sold: "1.1k+",
    sort_order: 10,
  },

  // 4. Merchandise & Sablon Pakaian
  {
    id: "prod-kaos-sablon-dtf",
    slug: "kaos-custom-sablon-dtf-premium",
    category_id: "cat-merchandise-sablon",
    name: "Kaos Custom Sablon DTF High Density (Cotton 30s)",
    description: "Kaos polos bahan 100% Cotton Combed 30s reaktif super adem dan nyaman dipakai. Dicetak dengan teknologi Direct-to-Film (DTF) terbaru yang lentur, warna raster tajam, tidak pecah, dan tahan dicuci berkali-kali.",
    price: 65000,
    compare_at_price: 85000,
    unit: "/ pcs",
    image_url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop",
    gallery: JSON.stringify([
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop"
    ]),
    specs: JSON.stringify([
      "Bahan Kaos 100% Cotton Combed 30s Reaktif",
      "Sablon DTF High Density Warna Tajam & Elastis",
      "Tersedia Ukuran S, M, L, XL, XXL",
      "Bisa Pesan Satuan Tanpa Minimal Order",
      "Didukung Pratinjau Desain Studio 3D Interaktif"
    ]),
    is_best_seller: true,
    is_active: true,
    rating: "5.0",
    sold: "1.5k+",
    sort_order: 11,
  },
  {
    id: "prod-totebag-kanvas-custom",
    slug: "totebag-kanvas-blacu-custom",
    category_id: "cat-merchandise-sablon",
    name: "Tote Bag Kanvas Blacu Premium (Resleting)",
    description: "Tas jinjing kain kanvas blacu tebal berkualitas dengan resleting penutup. Cocok untuk souvenir seminar kit kantor, merchandise komunitas, event kampus, maupun tas belanja ramah lingkungan.",
    price: 25000,
    compare_at_price: 32000,
    unit: "/ pcs",
    image_url: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=800&auto=format&fit=crop",
    gallery: JSON.stringify([
      "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=800&auto=format&fit=crop"
    ]),
    specs: JSON.stringify([
      "Bahan Kain Kanvas Blacu Tebal Kuat",
      "Ukuran Standar 30 x 40 cm dengan Resleting",
      "Cetak Sublim / DTF Full Color Area A4",
      "Jahitan Rapi & Tali Jinjing Dobel Kuat",
      "Bisa Digunakan di Studio Mockup 3D"
    ]),
    is_best_seller: false,
    is_active: true,
    rating: "4.9",
    sold: "820+",
    sort_order: 12,
  },
  {
    id: "prod-mug-keramik-custom",
    slug: "mug-keramik-custom-souvenir",
    category_id: "cat-merchandise-sablon",
    name: "Mug Keramik Custom Souvenir (+Box Putih)",
    description: "Gelas mug keramik putih bersertifikasi SNI dengan cetak foto atau logo full color keliling. Tahan air panas dan dingin, warna menyatu ke dalam glasir keramik sehingga awet bertahun-tahun.",
    price: 22000,
    compare_at_price: 28000,
    unit: "/ pcs",
    image_url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop",
    gallery: JSON.stringify([
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop"
    ]),
    specs: JSON.stringify([
      "Bahan Keramik Putih Super SNI (Food Grade)",
      "Area Cetak Sublimasi 20 x 8 cm Full Color",
      "Sudah Termasuk Box Putih Satuan Satuan",
      "Aman untuk Kopi / Teh Panas & Dingin",
      "Tanpa Minimal Order (Bisa Pesan 1 Pcs)"
    ]),
    is_best_seller: false,
    is_active: true,
    rating: "4.8",
    sold: "1.3k+",
    sort_order: 13,
  },

  // 5. Signage & Akrilik
  {
    id: "prod-neonbox-bulat-led",
    slug: "neon-box-bulat-dua-sisi-led",
    category_id: "cat-signage-akrilik",
    name: "Neon Box Bulat Dua Sisi LED (Diameter 60cm)",
    description: "Plang nama toko modern dua sisi berbentuk bulat dengan penerangan lampu LED module super terang namun hemat listrik. Rangka profil aluminium anti karat dan cover akrilik susu tahan cuaca outdoor.",
    price: 650000,
    compare_at_price: 750000,
    unit: "/ set",
    image_url: "https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=800&auto=format&fit=crop",
    gallery: JSON.stringify([
      "https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=800&auto=format&fit=crop"
    ]),
    specs: JSON.stringify([
      "Diameter 60 cm Bentuk Bulat Dua Muka (2 Sisi)",
      "Cover Akrilik Susu 3mm + Visual Cutting Stiker / UV",
      "Rangka Plat Aluminium Anti Karat Kuat Angin",
      "Lampu LED Module Samsung Super Terang & Trafo Outdoor",
      "Sudah Termasuk Bracket Gantungan Dinding"
    ]),
    is_best_seller: true,
    is_active: true,
    rating: "5.0",
    sold: "210+",
    sort_order: 14,
  },
  {
    id: "prod-plakat-akrilik-custom",
    slug: "plakat-akrilik-custom-event",
    category_id: "cat-signage-akrilik",
    name: "Plakat Akrilik Custom Event & Wisuda (Potong Laser)",
    description: "Trophy dan plakat penghargaan berbahan akrilik bening tebal 5mm - 8mm dengan teknik potong laser komputer presisi tinggi. Dicetak dengan mesin Flatbed UV langsung di atas akrilik menghasilkan warna cerah mewah.",
    price: 85000,
    compare_at_price: 110000,
    unit: "/ pcs",
    image_url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=800&auto=format&fit=crop",
    gallery: JSON.stringify([
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=800&auto=format&fit=crop"
    ]),
    specs: JSON.stringify([
      "Akrilik Marga Cipta Bening Tebal 5mm - 8mm",
      "Teknik Cutting Laser Bebas Bentuk Pola Custom",
      "Cetak Langsung UV Flatbed dengan Tinta Putih",
      "Tatakan / Kaki Akrilik Tebal Solid",
      "Sudah Termasuk Kotak Bludru Eksklusif (Opsional)"
    ]),
    is_best_seller: false,
    is_active: true,
    rating: "4.9",
    sold: "450+",
    sort_order: 15,
  },
];

export async function seedPrintingCatalog(): Promise<{
  success: boolean;
  categoriesInserted: number;
  productsInserted: number;
  error?: string;
}> {
  try {
    const now = new Date().toISOString();

    // 1. Upsert Categories
    const categoriesPayload = PRINTING_CATEGORIES.map((c) => ({
      ...c,
      created_at: now,
      updated_at: now,
    }));

    const { error: catErr } = await supabaseAdmin
      .from("categories")
      .upsert(categoriesPayload, { onConflict: "id" });

    if (catErr) {
      console.error("[SEED_CAT_ERR]", catErr.message);
      return { success: false, categoriesInserted: 0, productsInserted: 0, error: catErr.message };
    }

    // 2. Upsert Products
    const productsPayload = PRINTING_PRODUCTS.map((p) => ({
      ...p,
      created_at: now,
      updated_at: now,
    }));

    const { error: prodErr } = await supabaseAdmin
      .from("products")
      .upsert(productsPayload, { onConflict: "id" });

    if (prodErr) {
      console.error("[SEED_PROD_ERR]", prodErr.message);
      return {
        success: false,
        categoriesInserted: PRINTING_CATEGORIES.length,
        productsInserted: 0,
        error: prodErr.message,
      };
    }

    return {
      success: true,
      categoriesInserted: PRINTING_CATEGORIES.length,
      productsInserted: PRINTING_PRODUCTS.length,
    };
  } catch (err: any) {
    return {
      success: false,
      categoriesInserted: 0,
      productsInserted: 0,
      error: err.message || "Unknown error during seeding",
    };
  }
}
