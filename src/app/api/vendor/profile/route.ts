import { NextResponse } from "next/server";
import { requireRole } from "@/modules/auth";
import { getHubById, updateHub } from "@/modules/hubs";

export async function GET(request: Request) {
  try {
    const auth = await requireRole(["vendor", "admin"], request);
    if (!auth.authorized || !auth.user) return auth.response!;

    const hubId = auth.user.hubId || "00000000-0000-0000-0000-000000000001";
    const hub = await getHubById(hubId);

    return NextResponse.json({
      success: true,
      data: hub || {
        id: hubId,
        name: auth.user.username.includes("lubuk")
          ? "Hub Lubuk Buaya (Workshop Cabang)"
          : "Hub Pusat BAS Advertising Padang",
        address: auth.user.username.includes("lubuk")
          ? "Jl. Adinegoro No. 88, Lubuk Buaya, Padang"
          : "Jl. Belanti Baru No. 17, Lolong Belanti, Padang Utara",
        phone: "082283995544",
        whatsapp: "6282283995544",
        dailyCapacity: 50,
        isOpen: true,
        isActive: true,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireRole(["vendor", "admin"], request);
    if (!auth.authorized || !auth.user) return auth.response!;

    const hubId = auth.user.hubId || "00000000-0000-0000-0000-000000000001";
    const body = await request.json();

    const res = await updateHub(hubId, {
      isOpen: body.isOpen,
      dailyCapacity: body.dailyCapacity ? Number(body.dailyCapacity) : undefined,
      notes: body.notes,
    });

    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Profil dan status operasional workshop berhasil diperbarui",
      data: res.hub,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
