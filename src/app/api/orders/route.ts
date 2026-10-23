import { NextResponse } from "next/server";
import { createOrder, getOrders } from "@/lib/db/queries/orders";
import { OrderInputSchema } from "@/lib/validators";
import { requireAdmin } from "@/lib/auth/guard";
import { logAudit } from "@/lib/db/queries/audit";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = OrderInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || "Data formulir pesanan tidak valid",
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const { order, invoice, error } = await createOrder(parsed.data);
    if (error || !order) {
      return NextResponse.json({ success: false, error: error || "Gagal membuat pesanan" }, { status: 400 });
    }

    logAudit({
      actor: parsed.data.customerName,
      action: "CREATE_ORDER",
      entity: "orders",
      entityId: order.id,
      diff: { code: order.code, subtotal: order.subtotal, itemsCount: order.items.length },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Pesanan berhasil dicatat di sistem",
        order: {
          id: order.id,
          code: order.code,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          deliveryMethod: order.deliveryMethod,
          paymentMethod: order.paymentMethod,
          subtotal: order.subtotal,
          itemsCount: order.items.length,
        },
        invoice: invoice
          ? {
              invoiceNo: invoice.invoiceNo,
              publicToken: invoice.publicToken,
              total: invoice.snapshot?.total,
              uniqueCode: invoice.snapshot?.uniqueCode,
            }
          : null,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal memproses pesanan" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response!;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : undefined;

    const result = await getOrders({ status, limit, offset });

    return NextResponse.json({
      success: true,
      data: result.orders,
      total: result.total,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal memuat daftar pesanan" }, { status: 500 });
  }
}
