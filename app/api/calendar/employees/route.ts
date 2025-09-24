import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;
declare global { var _prisma: PrismaClient | undefined; }
if (!global._prisma) global._prisma = new PrismaClient();
prisma = global._prisma;

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId");

    if (!locationId) {
      return NextResponse.json({ ok: false, error: "Missing locationId" }, { status: 400 });
    }

    const items = await prisma.employee.findMany({
      where: { locations: { some: { locationId } } }, // EmployeeLocation
      select: { id: true, name: true, color: true, active: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ ok: true, items });
  } catch (err: any) {
    console.error("[employees.list] error", err);
    return NextResponse.json({ ok: false, error: err?.message || "Internal error" }, { status: 500 });
  }
}
