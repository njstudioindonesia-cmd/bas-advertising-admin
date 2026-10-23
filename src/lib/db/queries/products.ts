import { supabaseAdmin } from "@/lib/supabase/admin";
import { ProductInput } from "@/lib/validators";
import fallbackProductsData from "@/data/products.json";

export interface FormattedProduct {
  id: string;
  slug: string;
  name: string;
  title: string; // alias untuk kompatibilitas UI
  categoryId: string;
  category: string; // nama kategori
  description: string;
  desc: string; // alias
  price: string; // format tampilan "Rp 25.000"
  priceNumber: number; // integer 25000
  normalPrice?: string; // "Rp 35.000"
  compareAtPrice: number | null;
  unit: string;
  imageUrl: string;
  img: string; // alias
  gallery: string[];
  images: string[]; // alias
  specs: string[];
  isBestSeller: boolean;
  isActive: boolean;
  rating: string;
  sold: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export function formatRupiah(amount: number): string {
  return "Rp " + Math.round(amount).toLocaleString("id-ID");
}

export function syncProductsToJson(): void {
  // Cloud Supabase replaces local JSON sync
}

export function mapRowToProduct(r: any): FormattedProduct {
  const priceNum = Number(r.price) || 0;
  const compareAtNum = r.compare_at_price ? Number(r.compare_at_price) : null;

  let gallery: string[] = [];
  if (Array.isArray(r.gallery)) {
    gallery = r.gallery;
  } else if (typeof r.gallery === "string") {
    try {
      gallery = JSON.parse(r.gallery);
    } catch {
      gallery = [];
    }
  }

  let specs: string[] = [];
  if (Array.isArray(r.specs)) {
    specs = r.specs;
  } else if (typeof r.specs === "string") {
    try {
      specs = JSON.parse(r.specs);
    } catch {
      specs = [];
    }
  }

  const categoryName = r.categories?.name || r.category_name || "Lainnya";

  return {
    id: r.id,
    slug: r.slug || r.id,
    name: r.name,
    title: r.name,
    categoryId: r.category_id || "",
    category: categoryName,
    description: r.description || "",
    desc: r.description || "",
    price: formatRupiah(priceNum),
    priceNumber: priceNum,
    normalPrice: compareAtNum ? formatRupiah(compareAtNum) : undefined,
    compareAtPrice: compareAtNum,
    unit: r.unit || "/ pcs",
    imageUrl: r.image_url || "",
    img: r.image_url || "",
    gallery,
    images: gallery.length > 0 ? gallery : [r.image_url || ""],
    specs,
    isBestSeller: Boolean(r.is_best_seller),
    isActive: Boolean(r.is_active),
    rating: r.rating || "5.0",
    sold: r.sold || "0",
    sortOrder: Number(r.sort_order) || 0,
    createdAt: r.created_at || new Date().toISOString(),
    updatedAt: r.updated_at || new Date().toISOString(),
  };
}

function getFallbackProducts(): FormattedProduct[] {
  return (fallbackProductsData as any[]).map((p: any, idx: number) => {
    const priceNum = typeof p.priceNumber === "number" ? p.priceNumber : 0;
    const compareAtNum = typeof p.compareAtPrice === "number" ? p.compareAtPrice : null;
    const gallery =
      Array.isArray(p.images) && p.images.length > 0
        ? p.images
        : Array.isArray(p.gallery) && p.gallery.length > 0
        ? p.gallery
        : p.imageUrl || p.img
        ? [p.imageUrl || p.img]
        : [];
    const specs = Array.isArray(p.specs) ? p.specs : [];

    return {
      id: p.id || `prod-${idx}`,
      slug: p.slug || p.id || `prod-${idx}`,
      name: p.name || p.title || "Produk",
      title: p.title || p.name || "Produk",
      categoryId: p.categoryId || "cat-umum",
      category: p.category || "Umum",
      description: p.description || p.desc || "",
      desc: p.desc || p.description || "",
      price: p.price || formatRupiah(priceNum),
      priceNumber: priceNum,
      normalPrice: p.normalPrice || (compareAtNum ? formatRupiah(compareAtNum) : undefined),
      compareAtPrice: compareAtNum,
      unit: p.unit || "/ pcs",
      imageUrl: p.imageUrl || p.img || "",
      img: p.img || p.imageUrl || "",
      gallery,
      images: gallery,
      specs,
      isBestSeller: Boolean(p.isBestSeller),
      isActive: p.isActive !== false,
      rating: p.rating || "5.0",
      sold: p.sold || "0",
      sortOrder: typeof p.sortOrder === "number" ? p.sortOrder : idx,
      createdAt: p.createdAt || new Date().toISOString(),
      updatedAt: p.updatedAt || new Date().toISOString(),
    };
  });
}

function filterProductsInMemory(
  all: FormattedProduct[],
  options?: {
    category?: string;
    search?: string;
    includeInactive?: boolean;
    isBestSeller?: boolean;
    limit?: number;
    offset?: number;
  }
): { products: FormattedProduct[]; total: number } {
  let list = all;

  if (!options?.includeInactive) {
    list = list.filter((p) => p.isActive);
  }

  if (options?.category && options.category !== "Semua") {
    const cat = options.category.toLowerCase().trim();
    list = list.filter(
      (p) =>
        p.categoryId.toLowerCase() === cat ||
        p.category.toLowerCase() === cat ||
        p.category.toLowerCase().includes(cat)
    );
  }

  if (options?.search && options.search.trim()) {
    const q = options.search.trim().toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }

  if (options?.isBestSeller !== undefined) {
    list = list.filter((p) => p.isBestSeller === options.isBestSeller);
  }

  list = list.sort((a, b) => a.sortOrder - b.sortOrder);
  const total = list.length;

  if (options?.limit) {
    const start = options.offset || 0;
    list = list.slice(start, start + options.limit);
  }

  return { products: list, total };
}

export async function getProducts(options?: {
  category?: string;
  search?: string;
  includeInactive?: boolean;
  isBestSeller?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ products: FormattedProduct[]; total: number }> {
  try {
    let query = supabaseAdmin
      .from("products")
      .select("*, categories(name, slug)", { count: "exact" });

    if (!options?.includeInactive) {
      query = query.eq("is_active", true);
    }

    if (options?.category && options.category !== "Semua") {
      if (options.category.startsWith("cat-")) {
        query = query.eq("category_id", options.category);
      } else {
        // Filter by category name via Supabase inner join or ilike
        query = query.ilike("categories.name", options.category);
      }
    }

    if (options?.search && options.search.trim()) {
      const q = options.search.trim();
      query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
    }

    if (options?.isBestSeller !== undefined) {
      query = query.eq("is_best_seller", options.isBestSeller);
    }

    query = query.order("sort_order", { ascending: true }).order("created_at", { ascending: false });

    if (options?.limit) {
      const start = options.offset || 0;
      query = query.range(start, start + options.limit - 1);
    }

    const { data, count, error } = await query;

    if (!error && data && data.length > 0) {
      const products = data.map(mapRowToProduct);
      return {
        products,
        total: count !== null ? count : products.length,
      };
    }

    // Jika Supabase offline atau belum ada data di tabel, fallback ke products.json
    return filterProductsInMemory(getFallbackProducts(), options);
  } catch (err: any) {
    console.warn("[SUPABASE_OFFLINE] Menggunakan fallback data produk lokal:", err?.message);
    return filterProductsInMemory(getFallbackProducts(), options);
  }
}

export async function getProductById(id: string): Promise<FormattedProduct | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("*, categories(name, slug)")
      .or(`id.eq.${id},slug.eq.${id}`)
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return mapRowToProduct(data);
    }
  } catch (err: any) {
    // Supabase offline, fallback
  }

  const fallbacks = getFallbackProducts();
  return fallbacks.find((p) => p.id === id || p.slug === id) || null;
}

export async function createProduct(input: ProductInput): Promise<FormattedProduct> {
  const rawSlug =
    (input.slug && input.slug.trim()) ||
    input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  let slug = rawSlug || "produk";
  const id = input.id || slug + "-" + Date.now().toString(36);

  // Check unique slug
  const { data: existingSlug } = await supabaseAdmin
    .from("products")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existingSlug) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  }

  const now = new Date().toISOString();
  const payload = {
    id,
    slug,
    category_id: input.categoryId,
    name: input.name,
    description: input.description || "",
    price: input.price,
    compare_at_price: input.compareAtPrice || null,
    unit: input.unit || "/ pcs",
    image_url: input.imageUrl,
    gallery: input.gallery || [],
    specs: input.specs || [],
    is_best_seller: Boolean(input.isBestSeller),
    is_active: input.isActive !== undefined ? Boolean(input.isActive) : true,
    rating: input.rating || "5.0",
    sold: input.sold || "0",
    sort_order: input.sortOrder || 0,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabaseAdmin
    .from("products")
    .insert(payload)
    .select("*, categories(name, slug)")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Gagal menyimpan produk ke Supabase");
  }

  return mapRowToProduct(data);
}

export async function updateProduct(
  id: string,
  input: Partial<ProductInput>
): Promise<FormattedProduct | null> {
  const existing = await getProductById(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const updates: Record<string, any> = {
    updated_at: now,
  };

  if (input.name !== undefined) updates.name = input.name;
  if (input.slug !== undefined && input.slug.trim()) {
    updates.slug = input.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
  if (input.categoryId !== undefined) updates.category_id = input.categoryId;
  if (input.description !== undefined) updates.description = input.description;
  if (input.price !== undefined) updates.price = input.price;
  if (input.compareAtPrice !== undefined) updates.compare_at_price = input.compareAtPrice;
  if (input.unit !== undefined) updates.unit = input.unit;
  if (input.imageUrl !== undefined) updates.image_url = input.imageUrl;
  if (input.gallery !== undefined) updates.gallery = input.gallery;
  if (input.specs !== undefined) updates.specs = input.specs;
  if (input.isBestSeller !== undefined) updates.is_best_seller = Boolean(input.isBestSeller);
  if (input.isActive !== undefined) updates.is_active = Boolean(input.isActive);
  if (input.rating !== undefined) updates.rating = input.rating;
  if (input.sold !== undefined) updates.sold = input.sold;
  if (input.sortOrder !== undefined) updates.sort_order = input.sortOrder;

  // 1. Coba update record di Supabase
  const { data, error } = await supabaseAdmin
    .from("products")
    .update(updates)
    .eq("id", id)
    .select("*, categories(name, slug)")
    .maybeSingle();

  if (!error && data) {
    return mapRowToProduct(data);
  }

  // 2. Jika baris belum ada di Supabase, lakukan UPSERT lengkap!
  const fullPayload = {
    id: existing.id,
    slug: updates.slug || existing.slug,
    category_id: updates.category_id || existing.categoryId || "cat-spanduk-banner",
    name: updates.name || existing.name,
    description: updates.description !== undefined ? updates.description : existing.description,
    price: updates.price !== undefined ? updates.price : existing.priceNumber,
    compare_at_price: updates.compare_at_price !== undefined ? updates.compare_at_price : existing.compareAtPrice,
    unit: updates.unit || existing.unit,
    image_url: updates.image_url || existing.imageUrl,
    gallery: updates.gallery || existing.gallery,
    specs: updates.specs || existing.specs,
    is_best_seller: updates.is_best_seller !== undefined ? updates.is_best_seller : existing.isBestSeller,
    is_active: updates.is_active !== undefined ? updates.is_active : existing.isActive,
    rating: updates.rating || existing.rating,
    sold: updates.sold || existing.sold,
    sort_order: updates.sort_order !== undefined ? updates.sort_order : existing.sortOrder,
    created_at: existing.createdAt || now,
    updated_at: now,
  };

  const { data: upsertData, error: upsertError } = await supabaseAdmin
    .from("products")
    .upsert(fullPayload)
    .select("*, categories(name, slug)")
    .maybeSingle();

  if (!upsertError && upsertData) {
    return mapRowToProduct(upsertData);
  }

  throw new Error(upsertError?.message || error?.message || "Gagal memperbarui produk di Supabase");
}

export async function deleteProduct(id: string, softDelete = true): Promise<boolean> {
  try {
    if (softDelete) {
      const { error } = await supabaseAdmin
        .from("products")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .or(`id.eq.${id},slug.eq.${id}`);
      return !error;
    }

    const { error } = await supabaseAdmin
      .from("products")
      .delete()
      .or(`id.eq.${id},slug.eq.${id}`);

    return !error;
  } catch (err) {
    console.error("deleteProduct error:", err);
    return false;
  }
}
