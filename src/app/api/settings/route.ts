import { NextResponse } from "next/server";
import { getSettings, setMultipleSettings } from "@/lib/db/queries/settings";
import { requireAdmin } from "@/lib/auth/guard";
import { revalidateEntity } from "@/lib/cache-tags";
import { logAudit } from "@/lib/db/queries/audit";

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal memuat pengaturan" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response!;

    const body = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, error: "Data pengaturan harus berupa objek." }, { status: 400 });
    }

    await setMultipleSettings(body);

    logAudit({
      actor: "admin",
      action: "UPDATE",
      entity: "settings",
      diff: body,
    });

    revalidateEntity("settings", ["/", "/produk", "/keranjang", "/about", "/hubungi"]);

    const updated = await getSettings();
    return NextResponse.json({ success: true, message: "Pengaturan berhasil diperbarui", data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal memperbarui pengaturan" }, { status: 500 });
  }
}
