import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { getShippingTariffs, upsertShippingTariff } from "@/modules/delivery";
import { logAudit } from "@/lib/db/queries/audit";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response!;

    const tariffs = await getShippingTariffs();
    return NextResponse.json({ success: true, data: tariffs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response!;

    const body = await request.json();
    if (!body.hubId) {
      return NextResponse.json(
        { success: false, error: "hubId wajib disertakan." },
        { status: 400 }
      );
    }

    const res = await upsertShippingTariff(body);
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    logAudit({
      actor: "admin",
      action: "UPSERT_SHIPPING_TARIFF",
      entity: "shipping_tariffs",
      entityId: res.tariff?.id,
      diff: body,
    });

    return NextResponse.json({
      success: true,
      message: "Tarif ongkir berhasil disimpan",
      data: res.tariff,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
