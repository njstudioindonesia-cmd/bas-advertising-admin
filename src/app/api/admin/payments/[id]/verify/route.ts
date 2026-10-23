import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { verifyPayment } from "@/modules/payments";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response!;

    const { id: paymentId } = await context.params;
    const body = await request.json();

    if (!body.orderId) {
      return NextResponse.json(
        { success: false, error: "orderId wajib disertakan." },
        { status: 400 }
      );
    }

    const res = await verifyPayment(paymentId, body.orderId, {
      id: "admin",
      username: "admin",
    });

    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Pembayaran berhasil diverifikasi LUNAS. Pesanan dialokasikan ke antrean workshop.",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
