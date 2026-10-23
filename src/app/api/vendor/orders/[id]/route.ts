import { NextResponse } from "next/server";
import { requireRole } from "@/modules/auth";
import { getOrderById } from "@/modules/orders/service";
import { getInvoiceByOrderId } from "@/modules/invoices";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(["vendor", "admin"], request);
    if (!auth.authorized || !auth.user) return auth.response!;

    const { id: orderId } = await context.params;
    const order = await getOrderById(orderId);

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Pesanan cetak tidak ditemukan." },
        { status: 404 }
      );
    }

    // Verifikasi kepemilikan hub pesanan (kecuali admin)
    if (auth.user.role === "vendor" && auth.user.hubId) {
      if (order.hubId && order.hubId !== auth.user.hubId) {
        return NextResponse.json(
          {
            success: false,
            error: "Akses ditolak: Pesanan ini dialokasikan untuk titik workshop lain.",
          },
          { status: 403 }
        );
      }
    }

    const invoice = await getInvoiceByOrderId(orderId, undefined, true);

    return NextResponse.json({
      success: true,
      data: {
        ...order,
        invoiceNo: invoice?.invoiceNo || null,
        invoiceToken: invoice?.publicToken || null,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
