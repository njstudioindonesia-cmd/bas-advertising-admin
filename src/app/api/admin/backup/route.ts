import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/db/queries/audit";
import { revalidateEntity } from "@/lib/cache-tags";

async function exportFullSupabaseDatabase() {
  const [catRes, prodRes, banRes, setRes, portRes] = await Promise.all([
    supabaseAdmin.from("categories").select("*").order("sort_order", { ascending: true }),
    supabaseAdmin.from("products").select("*").order("sort_order", { ascending: true }),
    supabaseAdmin.from("banners").select("*").order("sort_order", { ascending: true }),
    supabaseAdmin.from("settings").select("*"),
    supabaseAdmin.from("portfolio").select("*").order("sort_order", { ascending: true }),
  ]);

  return {
    version: "2.0-supabase",
    exportedAt: new Date().toISOString(),
    system: "Cetak.inc — Printing & Advertising Studio (Supabase Cloud PostgreSQL)",
    data: {
      categories: catRes.data || [],
      products: prodRes.data || [],
      banners: banRes.data || [],
      settings: setRes.data || [],
      portfolio: portRes.data || [],
    },
  };
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response!;

    const dump = await exportFullSupabaseDatabase();

    return new NextResponse(JSON.stringify(dump, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="cetak-inc-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal membuat backup" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response!;

    const body = await request.json();
    const { action, confirmText, importData } = body;

    if (action === "import") {
      if (!importData || !importData.data) {
        return NextResponse.json({ success: false, error: "File data import tidak valid atau rusak." }, { status: 400 });
      }

      const { categories, products, banners, settings, portfolio } = importData.data;

      if (Array.isArray(categories) && categories.length > 0) {
        await supabaseAdmin.from("categories").upsert(categories);
      }

      if (Array.isArray(products) && products.length > 0) {
        await supabaseAdmin.from("products").upsert(products);
      }

      if (Array.isArray(banners) && banners.length > 0) {
        await supabaseAdmin.from("banners").upsert(banners);
      }

      if (Array.isArray(settings) && settings.length > 0) {
        await supabaseAdmin.from("settings").upsert(settings);
      }

      if (Array.isArray(portfolio) && portfolio.length > 0) {
        await supabaseAdmin.from("portfolio").upsert(portfolio);
      }

      logAudit({
        actor: "admin",
        action: "IMPORT_BACKUP",
        entity: "database",
        diff: { productsCount: products?.length, categoriesCount: categories?.length },
      });

      revalidateEntity("products");
      revalidateEntity("categories");
      revalidateEntity("banners");
      revalidateEntity("portfolio");
      revalidateEntity("settings");

      return NextResponse.json({
        success: true,
        message: "Data backup berhasil diimpor dan disinkronkan ke Supabase Cloud PostgreSQL.",
      });
    }

    return NextResponse.json({ success: false, error: "Aksi tidak dikenal" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal memproses aksi backup" }, { status: 500 });
  }
}
