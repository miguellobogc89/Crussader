// app/api/notifications/unread-count/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const count = await prisma.notification.count({
      where: { status: "unread" },
    });

    return NextResponse.json({ ok: true, count });
  } catch (err) {
    console.error("unread-count error:", err);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
