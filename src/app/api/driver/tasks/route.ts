import { NextResponse } from "next/server";
import { requireRole } from "@/modules/auth";
import {
  getDriverTasks,
  getDriverOnlineStatus,
  setDriverOnlineStatus,
} from "@/modules/delivery";

export async function GET(request: Request) {
  try {
    const auth = await requireRole(["driver", "admin"], request);
    if (!auth.authorized || !auth.user) return auth.response!;

    const driverId = auth.user.id;
    const tasks = await getDriverTasks(driverId);
    const isOnline = await getDriverOnlineStatus(driverId);

    return NextResponse.json({
      success: true,
      data: {
        activeTask: tasks.activeTask,
        availableTasks: tasks.availableTasks,
        isOnline,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memuat tugas driver." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireRole(["driver", "admin"], request);
    if (!auth.authorized || !auth.user) return auth.response!;

    const body = await request.json();
    const { isOnline } = body;

    if (typeof isOnline !== "boolean") {
      return NextResponse.json(
        { success: false, error: "Nilai isOnline wajib boolean." },
        { status: 400 }
      );
    }

    const updated = await setDriverOnlineStatus(auth.user.id, isOnline);

    return NextResponse.json({
      success: true,
      message: `Status kurir berhasil diubah ke: ${updated ? "ONLINE" : "OFFLINE"}`,
      data: { isOnline: updated },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memperbarui status kurir." },
      { status: 500 }
    );
  }
}
