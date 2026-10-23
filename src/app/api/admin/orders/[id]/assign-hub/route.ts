import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getHubById } from "@/modules/hubs";
import { logAudit } from "@/lib/db/queries/audit";
import { publishEvent } from "@/lib/events";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response!;

    const { id: orderId } = await params;
    const body = await request.json();
    const { hubId } = body;

    if (!hubId) {
      return NextResponse.json({ success: false, error: "hubId wajib diisi." }, { status: 400 });
    }

    const hub = await getHubById(hubId);
    if (!hub) {
      return NextResponse.json({ success: false, error: "Hub tidak ditemukan." }, { status: 404 });
    }

    const { error: updErr } = await supabaseAdmin
      .from("orders")
      .update({
        hub_id: hubId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updErr) {
      return NextResponse.json({ success: false, error: updErr.message }, { status: 500 });
    }

    logAudit({
      actor: "admin",
      action: "ASSIGN_HUB_OVERRIDE",
      entity: "orders",
      entityId: orderId,
      diff: { hubId, hubName: hub.name },
    });

    await publishEvent("ORDER_ASSIGNED_HUB", {
      orderId,
      hubId,
      hubName: hub.name,
      assignedBy: "admin",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Pesanan berhasil dialokasikan ke ${hub.name}`,
      data: { orderId, hubId, hubName: hub.name },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
