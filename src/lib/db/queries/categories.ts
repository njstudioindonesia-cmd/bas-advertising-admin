import { supabaseAdmin } from "@/lib/supabase/admin";
import { CategoryInput } from "@/lib/validators";

export interface CategoryRecord {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_FALLBACK_CATEGORIES: CategoryRecord[] = [
  {
    id: "cat-outlet",
    slug: "branding-outlet",
    name: "Branding Outlet",
    icon: "Store",
    sortOrder: 1,
    isActive: true,
    productCount: 12,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cat-meja",
    slug: "branding-meja",
    name: "Branding Meja",
    icon: "Utensils",
    sortOrder: 2,
    isActive: true,
    productCount: 8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cat-packaging",
    slug: "packaging",
    name: "Packaging",
    icon: "Package",
    sortOrder: 3,
    isActive: true,
    productCount: 15,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cat-crew",
    slug: "crew",
    name: "Crew",
    icon: "Shirt",
    sortOrder: 4,
    isActive: true,
    productCount: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cat-marketing",
    slug: "marketing",
    name: "Marketing",
    icon: "Megaphone",
    sortOrder: 5,
    isActive: true,
    productCount: 14,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cat-cetak",
    slug: "barang-cetak-pendukung",
    name: "Barang Cetak Pendukung",
    icon: "FileText",
    sortOrder: 6,
    isActive: true,
    productCount: 11,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cat-merch",
    slug: "merchandise",
    name: "Merchandise",
    icon: "Gift",
    sortOrder: 7,
    isActive: true,
    productCount: 9,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cat-outdoor",
    slug: "outdoor-signage",
    name: "Outdoor & Signage",
    icon: "Sparkles",
    sortOrder: 8,
    isActive: true,
    productCount: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function getCategories(includeInactive = false): Promise<CategoryRecord[]> {
  try {
    let query = supabaseAdmin
      .from("categories")
      .select("*, products(id, is_active)")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data.map((r: any) => {
        const activeProducts = (r.products || []).filter((p: any) => p.is_active);
        return {
          id: r.id,
          slug: r.slug,
          name: r.name,
          icon: r.icon || "Package",
          sortOrder: Number(r.sort_order) || 0,
          isActive: Boolean(r.is_active),
          productCount: activeProducts.length,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        };
      });
    }
  } catch (err: any) {
    console.warn("[SUPABASE_OFFLINE] Menggunakan fallback data kategori lokal");
  }

  return includeInactive
    ? DEFAULT_FALLBACK_CATEGORIES
    : DEFAULT_FALLBACK_CATEGORIES.filter((c) => c.isActive);
}

export async function getCategoryById(id: string): Promise<CategoryRecord | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("categories")
      .select("*")
      .or(`id.eq.${id},slug.eq.${id}`)
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return {
        id: data.id,
        slug: data.slug,
        name: data.name,
        icon: data.icon,
        sortOrder: Number(data.sort_order) || 0,
        isActive: Boolean(data.is_active),
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    }
  } catch {
    // offline fallback
  }

  return (
    DEFAULT_FALLBACK_CATEGORIES.find(
      (c) => c.id === id || c.slug === id || c.name.toLowerCase() === id.toLowerCase()
    ) || null
  );
}

export async function getCategoryBySlug(slug: string): Promise<CategoryRecord | null> {
  return getCategoryById(slug);
}

export async function createCategory(input: CategoryInput): Promise<CategoryRecord> {
  const rawSlug =
    (input.slug && input.slug.trim()) ||
    input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  let slug = rawSlug || "kategori";
  const id = input.id || "cat-" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

  // Check unique slug
  const { data: existing } = await supabaseAdmin
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  }

  const now = new Date().toISOString();
  const payload = {
    id,
    slug,
    name: input.name,
    icon: input.icon || "Package",
    sort_order: input.sortOrder || 0,
    is_active: input.isActive !== undefined ? Boolean(input.isActive) : true,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabaseAdmin
    .from("categories")
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Gagal membuat kategori di Supabase");
  }

  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    icon: data.icon,
    sortOrder: Number(data.sort_order) || 0,
    isActive: Boolean(data.is_active),
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updateCategory(
  id: string,
  input: Partial<CategoryInput>
): Promise<CategoryRecord | null> {
  const existing = await getCategoryById(id);
  if (!existing) return null;

  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) updates.name = input.name;
  if (input.slug !== undefined && input.slug.trim()) {
    updates.slug = input.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
  if (input.icon !== undefined) updates.icon = input.icon;
  if (input.sortOrder !== undefined) updates.sort_order = input.sortOrder;
  if (input.isActive !== undefined) updates.is_active = Boolean(input.isActive);

  const { data, error } = await supabaseAdmin
    .from("categories")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Gagal memperbarui kategori di Supabase");
  }

  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    icon: data.icon,
    sortOrder: Number(data.sort_order) || 0,
    isActive: Boolean(data.is_active),
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
  // Cek apakah masih ada produk di kategori ini (RESTRICT rule)
  const { count } = await supabaseAdmin
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("category_id", id);

  if (count && count > 0) {
    return {
      success: false,
      error: `Tidak dapat menghapus kategori ini karena masih berisi ${count} produk. Silakan pindahkan atau hapus produk terlebih dahulu.`,
    };
  }

  const { error } = await supabaseAdmin
    .from("categories")
    .delete()
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
