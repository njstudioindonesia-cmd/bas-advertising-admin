import { NextResponse } from "next/server";
import { getPortfolioById, updatePortfolioItem, deletePortfolioItem } from "@/lib/db/queries/portfolio";
import { PortfolioInputSchema } from "@/lib/validators";
import { requireAdmin } from "@/lib/auth/guard";
import { revalidateEntity } from "@/lib/cache-tags";
import { logAudit } from "@/lib/db/queries/audit";
import { deleteStorageFile } from "@/lib/storage-helper";
import { triggerRemoteStoreRevalidation } from "@/lib/revalidate-remote";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await getPortfolioById(id);
    if (!item) {
      return NextResponse.json({ success: false, error: "Item inspirasi tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: item });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal memuat item inspirasi" }, { status: 500 });
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
    const partial = PortfolioInputSchema.partial().safeParse(body);

    if (!partial.success) {
      return NextResponse.json(
        { success: false, error: partial.error.issues[0]?.message || "Input tidak valid" },
        { status: 400 }
      );
    }

    const existing = await getPortfolioById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Item inspirasi tidak ditemukan" }, { status: 404 });
    }

    const updated = await updatePortfolioItem(id, {
      title: partial.data.title,
      client: partial.data.client,
      category: partial.data.category,
      imageUrl: partial.data.imageUrl,
      description: partial.data.description,
      sortOrder: partial.data.sortOrder,
      isActive: partial.data.isActive,
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: "Item inspirasi tidak ditemukan" }, { status: 404 });
    }

    // Jika gambar diganti dan gambar lama adalah file upload storage
    if (partial.data.imageUrl && existing.imageUrl && partial.data.imageUrl !== existing.imageUrl) {
      deleteStorageFile(existing.imageUrl).catch(() => {});
    }

    logAudit({
      actor: "admin",
      action: "UPDATE",
      entity: "portfolio",
      entityId: id,
      diff: partial.data,
    });

    revalidateEntity("portfolio");
    triggerRemoteStoreRevalidation();

    return NextResponse.json({
      success: true,
      message: "Item inspirasi berhasil diperbarui",
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memperbarui item inspirasi" },
      { status: 500 }
    );
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
    const existing = await getPortfolioById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Item inspirasi tidak ditemukan" }, { status: 404 });
    }

    const ok = await deletePortfolioItem(id);
    if (!ok) {
      return NextResponse.json({ success: false, error: "Gagal menghapus item inspirasi" }, { status: 500 });
    }

    if (existing.imageUrl) {
      deleteStorageFile(existing.imageUrl).catch(() => {});
    }

    logAudit({
      actor: "admin",
      action: "DELETE",
      entity: "portfolio",
      entityId: id,
      diff: { title: existing.title },
    });

    revalidateEntity("portfolio");
    triggerRemoteStoreRevalidation();

    return NextResponse.json({ success: true, message: "Item inspirasi berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menghapus item inspirasi" },
      { status: 500 }
    );
  }
}
