import { NextResponse } from "next/server";
import { requireRole } from "@/modules/auth";
import { claimDeliveryTask } from "@/modules/delivery";
import { logAudit } from "@/lib/db/queries/audit";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(["admin"], request);
    if (!auth.authorized || !auth.user) return auth.response!;

    const { id: orderId } = await context.params;
    const body = await request.json();
    const { driverId, driverName, driverPhone, driverPlate } = body;

    const result = await claimDeliveryTask(orderId, {
      id: driverId || "driver-internal-padang",
      fullName: driverName || "Kurir Workshop Cetak.inc",
      phone: driverPhone || "082283995544",
      plate: driverPlate || "BA 4821 QA",
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    logAudit({
      actor: auth.user.username,
      action: "ASSIGN_DRIVER",
      entity: "ORDER",
      entityId: orderId,
      diff: { driverName, driverPlate },
    });

    return NextResponse.json({
      success: true,
      message: `Kurir ${driverName || "internal"} berhasil ditugaskan untuk pesanan #${orderId}`,
      data: result.task,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menugaskan kurir." },
      { status: 500 }
    );
  }
}
