import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteSession, getSessionTokenFromCookies } from "@/lib/auth/session";

export async function POST() {
  try {
    const token = await getSessionTokenFromCookies();
    if (token) {
      deleteSession(token);
    }

    const cookieStore = await cookies();
    cookieStore.delete("bas_admin_token");
    cookieStore.delete("cetak_auth_token");

    return NextResponse.json({ success: true, message: "Berhasil logout." });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal logout" }, { status: 500 });
  }
}
