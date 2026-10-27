import { NextResponse } from "next/server";
import { getProductById, updateProduct, deleteProduct } from "@/lib/db/queries/products";
import { ProductInputSchema } from "@/lib/validators";
import { requireAdmin } from "@/lib/auth/guard";
import { revalidateEntity } from "@/lib/cache-tags";
import { logAudit } from "@/lib/db/queries/audit";
import { deleteStorageFile, deleteStorageFiles } from "@/lib/storage-helper";
import { triggerRemoteStoreRevalidation } from "@/lib/revalidate-remote";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await getProductById(id);

    if (!product) {
      return NextResponse.json({ success: false, error: "Produk tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, data: product },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal memuat produk" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response!;

    const { id } = await params;
    const body = await request.json();

    const partialSchema = ProductInputSchema.partial();
    const parsed = partialSchema.safeParse(body);

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

    const existing = await getProductById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Produk tidak ditemukan" }, { status: 404 });
    }

    const updated = await updateProduct(id, parsed.data);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Produk tidak ditemukan" }, { status: 404 });
    }

    // Jika gambar produk diganti, bersihkan gambar lama dari Supabase Storage untuk mencegah pembengkakan
    if (parsed.data.imageUrl && existing.imageUrl && parsed.data.imageUrl !== existing.imageUrl) {
      deleteStorageFile(existing.imageUrl).catch(() => {});
    }

    logAudit({
      actor: "admin",
      action: "UPDATE",
      entity: "products",
      entityId: id,
      diff: parsed.data,
    });

    revalidateEntity("products", ["/", "/produk", `/produk/${id}`, `/produk/${updated.slug}`]);
    triggerRemoteStoreRevalidation();

    return NextResponse.json({ success: true, message: "Produk berhasil diperbarui", data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal memperbarui produk" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response!;

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get("permanent") === "true";

    const existing = await getProductById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Produk tidak ditemukan" }, { status: 404 });
    }

    const targetId = existing.id || id;
    const ok = await deleteProduct(targetId, !permanent);
    if (!ok) {
      return NextResponse.json({ success: false, error: "Gagal menghapus produk dari database" }, { status: 500 });
    }

    // Jika dihapus permanen, bersihkan gambar utama & galeri dari Supabase Storage
    if (permanent) {
      const imagesToDelete = [existing.imageUrl, existing.img, ...(existing.gallery || []), ...(existing.images || [])]
        .filter((url): url is string => Boolean(url && typeof url === "string"));
      if (imagesToDelete.length > 0) {
        deleteStorageFiles(imagesToDelete).catch(() => {});
      }
    }

    logAudit({
      actor: "admin",
      action: permanent ? "HARD_DELETE" : "SOFT_DELETE",
      entity: "products",
      entityId: targetId,
      diff: { name: existing.name },
    });

    revalidateEntity("products", ["/", "/produk", `/produk/${targetId}`, `/produk/${existing.slug}`]);
    triggerRemoteStoreRevalidation();

    return NextResponse.json({
      success: true,
      message: permanent ? "Produk dihapus secara permanen dari database" : "Produk dinonaktifkan dari katalog",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal menghapus produk" }, { status: 500 });
  }
}
