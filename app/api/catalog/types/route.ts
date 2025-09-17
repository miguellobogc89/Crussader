import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";         // Prisma no en Edge
export const dynamic = "force-dynamic";  // sin caché

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const activityId = searchParams.get("activityId");

    if (!activityId) {
      return NextResponse.json({ types: [] }, { status: 400 });
    }

    const types = await prisma.type.findMany({
      where: { activityId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ types });
  } catch (err) {
    console.error("GET /api/catalog/types error:", err);
    return NextResponse.json({ types: [] }, { status: 500 });
  }
}
