import { NextResponse } from "next/server";
import { requireRole } from "@/modules/auth";
import { updateDeliveryTaskStatus } from "@/modules/delivery";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(["driver", "admin"], request);
    if (!auth.authorized || !auth.user) return auth.response!;

    const { id: orderId } = await context.params;
    const body = await request.json();
    const { targetStatus, proofPhotoUrl, notes } = body;

    const validStatuses = ["KURIR_MENJEMPUT", "DALAM_PERJALANAN", "TIBA", "SELESAI"];
    if (!targetStatus || !validStatuses.includes(targetStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Status target tidak valid. Pilihan: ${validStatuses.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const result = await updateDeliveryTaskStatus(
      orderId,
      targetStatus as any,
      {
        id: auth.user.id,
        role: auth.user.role,
        username: auth.user.username,
        fullName: auth.user.fullName || undefined,
      },
      { proofPhotoUrl, notes }
    );

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Status pengantaran berhasil diperbarui ke: ${targetStatus}`,
      data: { status: targetStatus },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memperbarui status pengantaran." },
      { status: 500 }
    );
  }
}
