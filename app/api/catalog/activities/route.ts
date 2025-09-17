// app/api/catalog/activities/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";           // Prisma no en Edge
export const dynamic = "force-dynamic";    // sin caché

export async function GET() {
  try {
    const activities = await prisma.activity.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ activities });
  } catch (err) {
    console.error("GET /api/catalog/activities error:", err);
    return NextResponse.json({ activities: [] }, { status: 500 });
  }
}
