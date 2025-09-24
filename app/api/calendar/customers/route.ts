import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // ajusta si tu prisma está en otra ruta
import type { Prisma } from "@prisma/client";

// Types mínimos
type CreateBody = {
  companyId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
};

export const dynamic = "force-dynamic";

/**
 * GET /api/calendar/customers?companyId=...&q=...&limit=20&cursor=customerId
 * Lista clientes de una compañía (N:M CompanyCustomer), con búsqueda y paginación cursor.
 */
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

    // Filtro tipado explícitamente
    const where: Prisma.CustomerWhereInput = {
      companies: { some: { companyId } },
      ...(q
        ? {
            OR: [
              { firstName: { contains: q, mode: "insensitive" as const } },
              { lastName:  { contains: q, mode: "insensitive" as const } },
              { phone:     { contains: q, mode: "insensitive" as const } },
              { email:     { contains: q, mode: "insensitive" as const } },
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

/**
 * POST /api/calendar/customers
 * body: { companyId, firstName, lastName, phone, email? }
 * Crea Customer y lo asocia a Company vía CompanyCustomer.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateBody;
    const { companyId, firstName, lastName, phone, email } = body || {};

    if (!companyId || !firstName || !lastName || !phone) {
      return NextResponse.json(
        {
          ok: false,
          error: "companyId, firstName, lastName y phone son obligatorios",
        },
        { status: 400 }
      );
    }

    // Crea el cliente + relación con la company
    const customer = await prisma.customer.create({
      data: {
        firstName,
        lastName,
        phone,
        email: email || null,
        companies: {
          create: {
            companyId,
          },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
      },
    });

    return NextResponse.json({ ok: true, customer });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message || "Error al crear cliente" },
      { status: 500 }
    );
  }
}
