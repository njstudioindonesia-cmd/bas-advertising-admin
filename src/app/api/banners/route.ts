import { NextResponse } from "next/server";
import { getBanners, createBanner } from "@/lib/db/queries/banners";
import { BannerInputSchema } from "@/lib/validators";
import { requireAdmin } from "@/lib/auth/guard";
import { revalidateEntity } from "@/lib/cache-tags";
import { logAudit } from "@/lib/db/queries/audit";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";
    const banners = await getBanners(includeInactive);
    return NextResponse.json(
      { success: true, data: banners },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal mengambil banner" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response!;

    const body = await request.json();
    const parsed = BannerInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Input banner tidak valid" },
        { status: 400 }
      );
    }

    const created = await createBanner(parsed.data);

    logAudit({
      actor: "admin",
      action: "CREATE",
      entity: "banners",
      entityId: created.id,
      diff: { title: created.title },
    });

    revalidateEntity("banners");

    return NextResponse.json({ success: true, message: "Banner berhasil ditambahkan", data: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal menambahkan banner" }, { status: 500 });
  }
}
