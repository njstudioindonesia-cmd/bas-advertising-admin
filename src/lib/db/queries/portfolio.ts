import { supabaseAdmin } from "@/lib/supabase/admin";

export interface PortfolioRecord {
  id: string;
  title: string;
  client: string | null;
  category: string;
  imageUrl: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export async function getPortfolio(includeInactive = false): Promise<PortfolioRecord[]> {
  try {
    let query = supabaseAdmin
      .from("portfolio")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;
    if (error || !data) {
      console.error("[SUPABASE] Gagal memuat portofolio:", error?.message);
      return [];
    }

    return data.map((r: any) => ({
      id: r.id,
      title: r.title,
      client: r.client,
      category: r.category || "All Work",
      imageUrl: r.image_url,
      description: r.description,
      sortOrder: Number(r.sort_order) || 0,
      isActive: Boolean(r.is_active),
      createdAt: r.created_at,
    }));
  } catch (err: any) {
    console.error("[SUPABASE_ERR] Error getPortfolio:", err);
    return [];
  }
}

export async function getPortfolioById(id: string): Promise<PortfolioRecord | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("portfolio")
      .select("*")
      .eq("id", id)
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      title: data.title,
      client: data.client,
      category: data.category || "All Work",
      imageUrl: data.image_url,
      description: data.description,
      sortOrder: Number(data.sort_order) || 0,
      isActive: Boolean(data.is_active),
      createdAt: data.created_at,
    };
  } catch {
    return null;
  }
}

export async function createPortfolioItem(input: {
  title: string;
  client?: string | null;
  category?: string | null;
  imageUrl: string;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}): Promise<PortfolioRecord> {
  const id = "port-" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  const now = new Date().toISOString();

  const payload = {
    id,
    title: input.title,
    client: input.client || null,
    category: input.category || "All Work",
    image_url: input.imageUrl,
    description: input.description || null,
    sort_order: input.sortOrder || 0,
    is_active: input.isActive !== undefined ? Boolean(input.isActive) : true,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabaseAdmin
    .from("portfolio")
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Gagal membuat item portofolio di Supabase");
  }

  return {
    id: data.id,
    title: data.title,
    client: data.client,
    category: data.category || "All Work",
    imageUrl: data.image_url,
    description: data.description,
    sortOrder: Number(data.sort_order) || 0,
    isActive: Boolean(data.is_active),
    createdAt: data.created_at,
  };
}

export async function updatePortfolioItem(
  id: string,
  input: Partial<{
    title: string;
    client?: string | null;
    category?: string | null;
    imageUrl?: string;
    description?: string | null;
    sortOrder?: number;
    isActive?: boolean;
  }>
): Promise<PortfolioRecord | null> {
  const existing = await getPortfolioById(id);
  if (!existing) return null;

  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (input.title !== undefined) updates.title = input.title;
  if (input.client !== undefined) updates.client = input.client;
  if (input.category !== undefined) updates.category = input.category;
  if (input.imageUrl !== undefined) updates.image_url = input.imageUrl;
  if (input.description !== undefined) updates.description = input.description;
  if (input.sortOrder !== undefined) updates.sort_order = input.sortOrder;
  if (input.isActive !== undefined) updates.is_active = Boolean(input.isActive);

  const { data, error } = await supabaseAdmin
    .from("portfolio")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Gagal memperbarui portofolio di Supabase");
  }

  return {
    id: data.id,
    title: data.title,
    client: data.client,
    category: data.category || "All Work",
    imageUrl: data.image_url,
    description: data.description,
    sortOrder: Number(data.sort_order) || 0,
    isActive: Boolean(data.is_active),
    createdAt: data.created_at,
  };
}

export async function deletePortfolioItem(id: string): Promise<boolean> {
  const { error } = await supabaseAdmin.from("portfolio").delete().eq("id", id);
  return !error;
}
