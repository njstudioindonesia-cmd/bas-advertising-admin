import { NextResponse } from "next/server";
import { getCurrentUser } from "@/modules/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          fullName: user.fullName || user.username,
          hubId: user.hubId || null,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
