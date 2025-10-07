// app/api/calendar/employees/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let prisma: PrismaClient;
declare global { var _prisma: PrismaClient | undefined; }
if (!global._prisma) global._prisma = new PrismaClient();
prisma = global._prisma;

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params?.id;
  if (!id) return NextResponse.json({ error: "Missing employee id" }, { status: 400 });

  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const name = String(b?.name ?? "");
  const active = Boolean(b?.active);
  const locationIds: string[] = Array.isArray(b?.locationIds) ? b.locationIds.map(String) : [];

  if (!name.trim()) return NextResponse.json({ error: "Missing name" }, { status: 422 });

  await prisma.employee.update({ where: { id }, data: { name, active }, select: { id: true } });
  await prisma.employeeLocation.deleteMany({ where: { employeeId: id } });
  if (locationIds.length) {
    await prisma.employeeLocation.createMany({
      data: locationIds.map((locId) => ({ employeeId: id, locationId: String(locId) })),
      skipDuplicates: true,
    });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
