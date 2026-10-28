import { NextResponse } from "next/server";
import { getCategoryById, updateCategory, deleteCategory } from "@/lib/db/queries/categories";
import { CategoryInputSchema } from "@/lib/validators";
import { requireAdmin } from "@/lib/auth/guard";
import { revalidateEntity } from "@/lib/cache-tags";
import { logAudit } from "@/lib/db/queries/audit";
import { triggerRemoteStoreRevalidation } from "@/lib/revalidate-remote";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cat = await getCategoryById(id);
    if (!cat) {
      return NextResponse.json({ success: false, error: "Kategori tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: cat });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal memuat kategori" }, { status: 500 });
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
    const partial = CategoryInputSchema.partial().safeParse(body);

    if (!partial.success) {
      return NextResponse.json(
        { success: false, error: partial.error.issues[0]?.message || "Input tidak valid" },
        { status: 400 }
      );
    }

    const updated = await updateCategory(id, partial.data);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Kategori tidak ditemukan" }, { status: 404 });
    }

    logAudit({
      actor: "admin",
      action: "UPDATE",
      entity: "categories",
      entityId: id,
      diff: partial.data,
    });

    revalidateEntity("categories");
    triggerRemoteStoreRevalidation();

    return NextResponse.json({ success: true, message: "Kategori berhasil diperbarui", data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal memperbarui kategori" }, { status: 500 });
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
    const existing = await getCategoryById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Kategori tidak ditemukan" }, { status: 404 });
    }

    const res = await deleteCategory(id);
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    logAudit({
      actor: "admin",
      action: "DELETE",
      entity: "categories",
      entityId: id,
      diff: { name: existing.name },
    });

    revalidateEntity("categories");
    triggerRemoteStoreRevalidation();

    return NextResponse.json({ success: true, message: "Kategori berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal menghapus kategori" }, { status: 500 });
  }
}
