import { NextResponse } from "next/server";
import { requireRole } from "@/modules/auth";
import { transitionOrderStatus, getOrderById } from "@/modules/orders/service";
import { OrderStatus } from "@/modules/orders/types";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(["vendor", "admin"], request);
    if (!auth.authorized || !auth.user) return auth.response!;

    const { id: orderId } = await context.params;
    const body = await request.json();
    const { targetStatus, notes } = body;

    const validStatuses: OrderStatus[] = [
      "DITERIMA_VENDOR",
      "DIPRODUKSI",
      "SIAP_ANTAR",
      "DITOLAK_VENDOR",
    ];

    if (!validStatuses.includes(targetStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Status target tidak valid. Pilihan yang diizinkan untuk vendor: ${validStatuses.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Verifikasi kepemilikan hub pesanan (kecuali admin)
    const existingOrder = await getOrderById(orderId);
    if (existingOrder && auth.user.role === "vendor" && auth.user.hubId) {
      if (existingOrder.hubId && existingOrder.hubId !== auth.user.hubId) {
        return NextResponse.json(
          {
            success: false,
            error: "Akses ditolak: Pesanan ini dialokasikan untuk titik workshop lain.",
          },
          { status: 403 }
        );
      }
    }

    const res = await transitionOrderStatus(orderId, targetStatus, {
      id: auth.user.id,
      role: auth.user.role as any,
      username: auth.user.username,
    });

    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Status pesanan berhasil diperbarui menjadi ${targetStatus}`,
      newStatus: res.newStatus,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
