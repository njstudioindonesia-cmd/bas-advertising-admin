import { NextResponse } from "next/server";
import { requireRole } from "@/modules/auth";
import { getDriverHistory } from "@/modules/delivery";

export async function GET(request: Request) {
  try {
    const auth = await requireRole(["driver", "admin"], request);
    if (!auth.authorized || !auth.user) return auth.response!;

    const history = await getDriverHistory(auth.user.id);

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memuat riwayat pengantaran." },
      { status: 500 }
    );
  }
}
