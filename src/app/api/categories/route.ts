import { NextResponse } from "next/server";
import { getCategories, createCategory } from "@/lib/db/queries/categories";
import { CategoryInputSchema } from "@/lib/validators";
import { requireAdmin } from "@/lib/auth/guard";
import { revalidateEntity } from "@/lib/cache-tags";
import { logAudit } from "@/lib/db/queries/audit";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";
    const categories = await getCategories(includeInactive);

    return NextResponse.json(
      { success: true, data: categories },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal mengambil kategori" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response!;

    const body = await request.json();
    const parsed = CategoryInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Data kategori tidak valid" },
        { status: 400 }
      );
    }

    const created = await createCategory(parsed.data);

    logAudit({
      actor: "admin",
      action: "CREATE",
      entity: "categories",
      entityId: created.id,
      diff: { name: created.name },
    });

    revalidateEntity("categories");

    return NextResponse.json({ success: true, message: "Kategori berhasil ditambahkan", data: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal menambahkan kategori" }, { status: 500 });
  }
}
