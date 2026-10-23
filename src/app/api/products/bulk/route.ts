import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { revalidateEntity } from "@/lib/cache-tags";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/db/queries/audit";

export async function PATCH(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response!;

    const body = await request.json();
    const { action, ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, error: "Daftar ID produk wajib disertakan." }, { status: 400 });
    }

    const now = new Date().toISOString();

    if (action === "activate") {
      const { error } = await supabaseAdmin
        .from("products")
        .update({ is_active: true, updated_at: now })
        .in("id", ids);
      if (error) throw new Error(error.message);
    } else if (action === "deactivate") {
      const { error } = await supabaseAdmin
        .from("products")
        .update({ is_active: false, updated_at: now })
        .in("id", ids);
      if (error) throw new Error(error.message);
    } else if (action === "delete") {
      const { error } = await supabaseAdmin
        .from("products")
        .delete()
        .in("id", ids);
      if (error) throw new Error(error.message);
    } else {
      return NextResponse.json({ success: false, error: "Aksi tidak dikenal" }, { status: 400 });
    }

    logAudit({
      actor: "admin",
      action: `BULK_${action.toUpperCase()}`,
      entity: "products",
      diff: { count: ids.length, ids },
    });

    revalidateEntity("products");

    return NextResponse.json({
      success: true,
      message: `Aksi ${action} berhasil diterapkan pada ${ids.length} produk di database Supabase.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal memproses aksi massal" }, { status: 500 });
  }
}
