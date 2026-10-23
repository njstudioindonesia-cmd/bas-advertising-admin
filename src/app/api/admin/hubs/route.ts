import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { getAllHubsAdmin, createHub } from "@/modules/hubs";
import { logAudit } from "@/lib/db/queries/audit";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response!;

    const hubs = await getAllHubsAdmin();
    return NextResponse.json({ success: true, data: hubs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response!;

    const body = await request.json();
    if (!body.name || !body.address) {
      return NextResponse.json(
        { success: false, error: "Nama hub dan alamat workshop wajib diisi." },
        { status: 400 }
      );
    }

    const res = await createHub(body);
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    logAudit({
      actor: "admin",
      action: "CREATE_HUB",
      entity: "hubs",
      entityId: res.hub?.id,
      diff: body,
    });

    return NextResponse.json({ success: true, data: res.hub }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
