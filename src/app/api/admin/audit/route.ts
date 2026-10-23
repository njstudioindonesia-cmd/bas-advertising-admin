import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { getAuditLogs } from "@/lib/db/queries/audit";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response!;

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50;
    const logs = await getAuditLogs(limit);

    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal memuat log audit" }, { status: 500 });
  }
}
