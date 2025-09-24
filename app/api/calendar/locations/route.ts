import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;
declare global { var _prisma: PrismaClient | undefined; }
if (!global._prisma) global._prisma = new PrismaClient();
prisma = global._prisma;

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Para la demo: todas las ACTIVE (o filtra por company si quieres)
    const items = await prisma.location.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, title: true, city: true, timezone: true },
      orderBy: { title: "asc" },
    });
    return NextResponse.json({ ok: true, items });
  } catch (err: any) {
    console.error("[locations.list] error", err);
    return NextResponse.json({ ok: false, error: err?.message || "Internal error" }, { status: 500 });
  }
}
