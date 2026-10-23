import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { getHubById, updateHub, deleteHub } from "@/modules/hubs";
import { logAudit } from "@/lib/db/queries/audit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response!;

    const { id } = await params;
    const hub = await getHubById(id);
    if (!hub) {
      return NextResponse.json({ success: false, error: "Hub tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: hub });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
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

    const res = await updateHub(id, body);
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    logAudit({
      actor: "admin",
      action: "UPDATE_HUB",
      entity: "hubs",
      entityId: id,
      diff: body,
    });

    return NextResponse.json({ success: true, data: res.hub });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
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
    const ok = await deleteHub(id);

    logAudit({
      actor: "admin",
      action: "DELETE_HUB",
      entity: "hubs",
      entityId: id,
    });

    return NextResponse.json({ success: ok });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
