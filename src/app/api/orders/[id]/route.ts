import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response!;

    const { id } = await params;
    const body = await request.json();

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (body.status) updates.status = body.status;

    if (body.courier) {
      const { data: existing } = await supabaseAdmin
        .from("orders")
        .select("note")
        .eq("id", id)
        .maybeSingle();

      let cleanNote = existing?.note ? existing.note.replace(/\[COURIER_DATA:.*?\]/, "").trim() : "";
      updates.note = `${cleanNote}\n[COURIER_DATA:${JSON.stringify(body.courier)}]`.trim();
    }

    const { data, error } = await supabaseAdmin
      .from("orders")
      .update(updates)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ success: false, error: "Gagal memperbarui status pesanan" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Status pesanan berhasil diubah menjadi ${body.status}`,
      data,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
