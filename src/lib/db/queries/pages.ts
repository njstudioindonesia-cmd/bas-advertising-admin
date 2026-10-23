import { supabaseAdmin } from "@/lib/supabase/admin";

export interface PageRecord {
  slug: string;
  title: string;
  content: any;
  updatedAt: string;
}

export async function getPage(slug: string): Promise<PageRecord | null> {
  try {
    const { data } = await supabaseAdmin
      .from("settings")
      .select("value")
      .eq("key", `page.${slug}`)
      .limit(1)
      .maybeSingle();

    if (!data?.value) return null;
    return data.value as PageRecord;
  } catch {
    return null;
  }
}

export async function setPage(slug: string, title: string, content: any): Promise<PageRecord> {
  const record: PageRecord = {
    slug,
    title,
    content,
    updatedAt: new Date().toISOString(),
  };

  await supabaseAdmin.from("settings").upsert({
    key: `page.${slug}`,
    value: record,
    updated_at: record.updatedAt,
  });

  return record;
}
