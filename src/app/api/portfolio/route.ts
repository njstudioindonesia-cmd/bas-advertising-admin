import { NextResponse } from "next/server";
import { getPortfolio, createPortfolioItem } from "@/lib/db/queries/portfolio";
import { PortfolioInputSchema } from "@/lib/validators";
import { requireAdmin } from "@/lib/auth/guard";
import { revalidateEntity } from "@/lib/cache-tags";
import { logAudit } from "@/lib/db/queries/audit";
import { triggerRemoteStoreRevalidation } from "@/lib/revalidate-remote";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";
    const items = await getPortfolio(includeInactive);
    return NextResponse.json(
      { success: true, data: items },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengambil inspirasi cetak" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response!;

    const body = await request.json();
    const parsed = PortfolioInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Input portofolio tidak valid" },
        { status: 400 }
      );
    }

    const created = await createPortfolioItem({
      title: parsed.data.title,
      client: parsed.data.client,
      category: parsed.data.category,
      imageUrl: parsed.data.imageUrl,
      description: parsed.data.description,
      sortOrder: parsed.data.sortOrder,
      isActive: parsed.data.isActive,
    });

    logAudit({
      actor: "admin",
      action: "CREATE",
      entity: "portfolio",
      entityId: created.id,
      diff: { title: created.title },
    });

    revalidateEntity("portfolio");
    triggerRemoteStoreRevalidation();

    return NextResponse.json(
      { success: true, message: "Inspirasi hasil cetak berhasil ditambahkan", data: created },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menambahkan inspirasi cetak" },
      { status: 500 }
    );
  }
}
