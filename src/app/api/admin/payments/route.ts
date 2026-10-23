import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { getPayments } from "@/modules/payments";
import { PaymentStatus } from "@/modules/payments/types";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response!;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as PaymentStatus | null;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50;

    const payments = await getPayments({
      status: status || undefined,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: payments,
      total: payments.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
