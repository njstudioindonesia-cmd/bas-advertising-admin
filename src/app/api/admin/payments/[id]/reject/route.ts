import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { rejectPayment } from "@/modules/payments";

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

    const reason = body.reason || "Bukti transfer tidak valid atau nominal tidak sesuai.";

    const res = await rejectPayment(paymentId, body.orderId, reason, {
      id: "admin",
      username: "admin",
    });

    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Bukti pembayaran berhasil ditolak. Status pesanan diperbarui.",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
