import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/db/queries/audit";

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response!;

    const body = await request.json();
    const { oldPassword, newPassword } = body;

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ success: false, error: "Password lama dan password baru wajib diisi." }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ success: false, error: "Password baru minimal 6 karakter." }, { status: 400 });
    }

    const { data: admin, error } = await supabaseAdmin
      .from("admin_users")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error || !admin) {
      return NextResponse.json({ success: false, error: "User admin tidak ditemukan di database." }, { status: 404 });
    }

    const envAdminPass = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV !== "production" ? "UrangDalamBAS2026!#" : "");
    const match = verifyPassword(oldPassword, admin.password_hash);
    if (!match && (!envAdminPass || oldPassword !== envAdminPass)) {
      return NextResponse.json({ success: false, error: "Password lama tidak cocok." }, { status: 400 });
    }

    const newHash = hashPassword(newPassword);
    const [salt] = newHash.split(":");

    await supabaseAdmin
      .from("admin_users")
      .update({
        password_hash: newHash,
        salt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", admin.id);

    logAudit({
      actor: admin.username,
      action: "CHANGE_PASSWORD",
      entity: "admin_users",
      entityId: admin.id,
    });

    return NextResponse.json({ success: true, message: "Password admin berhasil diperbarui di database Supabase." });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal mengubah password." }, { status: 500 });
  }
}
