import { NextResponse } from "next/server";
import { getCurrentUser } from "@/modules/auth";
import {
  upsertDriverLocation,
  getDriverLocation,
  getDriverLocationByOrderId,
} from "@/modules/delivery";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user || (user.role !== "driver" && user.role !== "admin")) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak: Hanya driver yang dapat mengirim koordinat." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { lat, lng, heading, speed, orderId } = body;

    if (typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json(
        { success: false, error: "Format koordinat (lat, lng) tidak valid." },
        { status: 400 }
      );
    }

    const result = await upsertDriverLocation(user.id, lat, lng, heading, speed, orderId);

    return NextResponse.json({
      success: true,
      message: "Lokasi driver berhasil diperbarui.",
      data: result.location,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memperbarui lokasi driver." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    const driverId = searchParams.get("driverId");

    let location = null;
    if (orderId) {
      location = await getDriverLocationByOrderId(orderId);
    } else if (driverId) {
      location = await getDriverLocation(driverId);
    }

    return NextResponse.json({
      success: true,
      data: location,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memuat posisi driver." },
      { status: 500 }
    );
  }
}
