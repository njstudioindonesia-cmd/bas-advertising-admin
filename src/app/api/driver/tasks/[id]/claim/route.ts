import { NextResponse } from "next/server";
import { requireRole } from "@/modules/auth";
import { claimDeliveryTask } from "@/modules/delivery";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(["driver", "admin"], request);
    if (!auth.authorized || !auth.user) return auth.response!;

    const { id: orderId } = await context.params;
    const body = await request.json().catch(() => ({}));

    const result = await claimDeliveryTask(orderId, {
      id: auth.user.id,
      fullName: auth.user.fullName || "Kurir Workshop Cetak.inc",
      phone: auth.user.phone || "082283995544",
      plate: body.plate || "BA 4821 QA",
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Tugas pengantaran berhasil diambil. Silakan jemput pesanan di workshop.",
      data: result.task,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengambil tugas." },
      { status: 500 }
    );
  }
}
