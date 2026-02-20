// app/api/mybusiness/customers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const companyId = searchParams.get("companyId");
    if (!companyId) {
      return NextResponse.json(
        { ok: false, error: "companyId requerido" },
        { status: 400 }
      );
    }

    const q = (searchParams.get("q") || "").trim();
    const take = Math.min(Number(searchParams.get("limit") || 20), 50);
    const cursor = searchParams.get("cursor");

    const where: Prisma.CustomerWhereInput = {
      companies: { some: { companyId } },
      ...(q
        ? {
            OR: [
              { firstName: { contains: q, mode: "insensitive" as const } },
              { lastName: { contains: q, mode: "insensitive" as const } },
              { phone: { contains: q, mode: "insensitive" as const } },
              { email: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const items = await prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        createdAt: true,
      },
    });

    let nextCursor: string | null = null;
    if (items.length > take) {
      const last = items.pop()!;
      nextCursor = last.id;
    }

    return NextResponse.json({ ok: true, items, nextCursor });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message || "Error al listar clientes" },
      { status: 500 }
    );
  }
}