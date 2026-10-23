import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { seedPrintingCatalog } from "@/lib/db/printing-catalog-seed";
import { logAudit } from "@/lib/db/queries/audit";
import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response!;

    const result = await seedPrintingCatalog();

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Gagal mengisi katalog percetakan" },
        { status: 500 }
      );
    }

    try {
      revalidateTag(CACHE_TAGS.products, "layout");
      revalidateTag(CACHE_TAGS.categories, "layout");
    } catch {}

    logAudit({
      actor: "admin",
      action: "SEED_PRINTING_CATALOG",
      entity: "catalog",
      entityId: "printing-master",
      diff: {
        categories: result.categoriesInserted,
        products: result.productsInserted,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Katalog percetakan berhasil diisi! (${result.categoriesInserted} Kategori, ${result.productsInserted} Produk Unggulan)`,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Terjadi kesalahan internal" },
      { status: 500 }
    );
  }
}
