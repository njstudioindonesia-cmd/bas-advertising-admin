import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response!;

    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) {
      return NextResponse.json({ success: true, data: [] });
    }

    const mapped = data.map((r: any) => {
      let courierData: any = null;
      if (r.note && r.note.includes("[COURIER_DATA:")) {
        try {
          const match = r.note.match(/\[COURIER_DATA:(.*?)\]/);
          if (match && match[1]) {
            courierData = JSON.parse(match[1]);
          }
        } catch {}
      }

      return {
        id: r.id,
        code: r.code || r.id,
        customerName: r.customer_name || "Pelanggan",
        customerPhone: r.customer_phone || "",
        deliveryMethod: r.delivery_method || "kirim",
        address: r.address || "",
        paymentMethod: r.payment_method || "WhatsApp / Transfer",
        note: r.note ? r.note.replace(/\[COURIER_DATA:.*?\]/, "").trim() : "",
        subtotal: Number(r.subtotal) || 0,
        status: r.status || "BARU",
        courier: courierData,
        createdAt: r.created_at || new Date().toISOString(),
        updatedAt: r.updated_at || new Date().toISOString(),
      };
    });

    return NextResponse.json({ success: true, data: mapped });
  } catch (error: any) {
    return NextResponse.json({ success: true, data: [] });
  }
}
