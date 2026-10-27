import { NextResponse } from "next/server";
import { getProducts, createProduct } from "@/lib/db/queries/products";
import { ProductInputSchema } from "@/lib/validators";
import { requireAdmin } from "@/lib/auth/guard";
import { revalidateEntity } from "@/lib/cache-tags";
import { logAudit } from "@/lib/db/queries/audit";
import { triggerRemoteStoreRevalidation } from "@/lib/revalidate-remote";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;
    const query = searchParams.get("q") || undefined;
    const isBestSeller = searchParams.has("isBestSeller") ? searchParams.get("isBestSeller") === "true" : undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : undefined;
    const includeInactive = searchParams.get("includeInactive") === "true";

    const result = await getProducts({
      category,
      search: query,
      isBestSeller,
      limit,
      offset,
      includeInactive,
    });

    return NextResponse.json(
      {
        success: true,
        data: result.products,
        total: result.total,
        count: result.products.length,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengambil daftar produk" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response!;

    const body = await request.json();
    const parsed = ProductInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || "Data produk tidak valid",
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const created = await createProduct(parsed.data);

    logAudit({
      actor: "admin",
      action: "CREATE",
      entity: "products",
      entityId: created.id,
      diff: { name: created.name, price: created.priceNumber },
    });

    revalidateEntity("products", ["/", "/produk", `/produk/${created.id}`]);
    triggerRemoteStoreRevalidation();

    return NextResponse.json(
      { success: true, message: "Produk berhasil ditambahkan", data: created },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menambahkan produk" },
      { status: 500 }
    );
  }
}
