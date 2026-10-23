import { NextResponse } from "next/server";
import { getOrderById, updateOrderStatus } from "@/lib/db/queries/orders";
import { requireAdmin } from "@/lib/auth/guard";
import { logAudit } from "@/lib/db/queries/audit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response!;

    const { id } = await params;
    const order = await getOrderById(id);

    if (!order) {
      return NextResponse.json({ success: false, error: "Pesanan tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal memuat detail pesanan" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response!;

    const { id } = await params;
    const body = await request.json();
    const { status, courier } = body;

    const validStatuses = ["BARU", "DIPROSES", "SIAP", "DIKIRIM", "SHIPPED", "SELESAI", "BATAL"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Status tidak valid. Harus salah satu dari: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json({ success: false, error: "Pesanan tidak ditemukan" }, { status: 404 });
    }

    await updateOrderStatus(order.id, status, courier);

    logAudit({
      actor: "admin",
      action: "UPDATE_STATUS",
      entity: "orders",
      entityId: order.id,
      diff: { oldStatus: order.status, newStatus: status, courier },
    });

    return NextResponse.json({
      success: true,
      message: `Status pesanan #${order.code} berhasil diubah menjadi ${status}`,
      status,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal memperbarui status pesanan" }, { status: 500 });
  }
}
