// app/api/calendar/employees/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let prisma: PrismaClient;
declare global { var _prisma: PrismaClient | undefined; }
if (!global._prisma) global._prisma = new PrismaClient();
prisma = global._prisma;

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });
  }

  try {
    await prisma.employee.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    const msg = err?.message ?? "Error deactivating employee";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

