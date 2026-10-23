import { NextResponse } from "next/server";
import { submitPaymentProof } from "@/modules/payments";
import { getOrderById } from "@/lib/db/queries/orders";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    if (!body.proofUrl) {
      return NextResponse.json(
        { success: false, error: "Bukti pembayaran (foto/screenshot) wajib diunggah." },
        { status: 400 }
      );
    }

    // Ambil info pesanan untuk mengisi metadata
    const order = await getOrderById(id);
    const amount = body.amount
      ? Number(body.amount)
      : order
      ? order.subtotal + ((order as any).deliveryFee || (order as any).delivery_fee || 0)
      : 0;

    const res = await submitPaymentProof({
      orderId: id,
      orderCode: order?.code,
      customerName: order?.customerName,
      customerPhone: order?.customerPhone,
      amount,
      proofUrl: body.proofUrl,
      senderBank: body.senderBank,
      senderName: body.senderName,
      notes: body.notes,
    });

    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Bukti pembayaran berhasil diunggah. Admin Urang Dalam akan segera memverifikasi.",
      paymentId: res.paymentId,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
