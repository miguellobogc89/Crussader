// app/api/calendar/employees/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let prisma: PrismaClient;
declare global { var _prisma: PrismaClient | undefined; }
if (!global._prisma) global._prisma = new PrismaClient();
prisma = global._prisma;

/**
 * GET /api/calendar/employees?locationId=...
 * Lista empleados de una ubicación con sus roles (y rol primario de comodidad).
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const locationId = url.searchParams.get("locationId");

  if (!locationId) {
    return NextResponse.json({ error: "Missing locationId" }, { status: 400 });
  }

  // Empleados de la ubicación + sus roles
  const rows = await prisma.employee.findMany({
    where: {
      locations: { some: { locationId: String(locationId) } },
    },
    select: {
      id: true,
      name: true,
      active: true,
      roles: {
        select: {
          isPrimary: true,
          role: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true,
              active: true,
            },
          },
        },
        orderBy: [{ isPrimary: "desc" }, { role: { name: "asc" } }],
      },
    },
    orderBy: { name: "asc" },
  });

  const items = rows.map((e) => {
    const roles = e.roles.map((r) => ({
      isPrimary: r.isPrimary,
      role: {
        id: r.role.id,
        name: r.role.name,
        slug: r.role.slug,
        color: r.role.color,
        active: r.role.active,
      },
    }));

    const primary = roles.find((r) => r.isPrimary) ?? roles[0] ?? null;

    return {
      id: e.id,
      name: e.name,
      active: e.active,
      roles, // [{ isPrimary, role: { id, name, color, ... } }]
      primaryRoleName: primary?.role.name ?? null,
      primaryRoleColor: primary?.role.color ?? null,
    };
  });

  return NextResponse.json({ items }, { status: 200 });
}

/**
 * POST /api/calendar/employees
 * Crea o actualiza un empleado y sincroniza ubicaciones/roles.
 * Body JSON:
 *  - id?: string            -> si viene, UPDATE; si no, CREATE
 *  - name: string           -> requerido
 *  - active?: boolean       -> por defecto true
 *  - locationIds?: string[] -> lista completa a dejar (se sincroniza)
 *  - roleIds?: string[]     -> lista completa a dejar (se sincroniza; la 1ª queda isPrimary=true)
 *
 * Nota: Este endpoint no devuelve nada especial; el modal solo comprueba 2xx.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      name,
      active = true,
      locationIds = [],
      roleIds = [],
    }: {
      id?: string;
      name?: string;
      active?: boolean;
      locationIds?: string[];
      roleIds?: string[];
    } = body ?? {};

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Falta 'name' válido" }, { status: 400 });
    }

    // Normaliza arrays (únicos, strings)
    const locIds = Array.isArray(locationIds)
      ? Array.from(new Set(locationIds.map(String).filter(Boolean)))
      : [];
    const rIds = Array.isArray(roleIds)
      ? Array.from(new Set(roleIds.map(String).filter(Boolean)))
      : [];

    let employeeId = id;

    await prisma.$transaction(async (tx) => {
      // CREATE o UPDATE básicos
      if (!employeeId) {
        const created = await tx.employee.create({
          data: {
            name: name.trim(),
            active: !!active,
          },
          select: { id: true },
        });
        employeeId = created.id;
      } else {
        const exists = await tx.employee.findUnique({
          where: { id: employeeId },
          select: { id: true },
        });
        if (!exists) {
          throw new Error("Empleado no encontrado");
        }
        await tx.employee.update({
          where: { id: employeeId },
          data: {
            name: name.trim(),
            active: !!active,
          },
        });
      }

      // === Sincronizar ubicaciones ===
      // Si vienen IDs, dejamos exactamente esas. Si viene [] vaciamos todas.
      // 1) eliminar las que sobran
      await tx.employeeLocation.deleteMany({
        where: {
          employeeId: employeeId!,
          ...(locIds.length > 0 ? { locationId: { notIn: locIds } } : {}),
        },
      });
      // 2) crear las que falten
      if (locIds.length > 0) {
        await tx.employeeLocation.createMany({
          data: locIds.map((locationId) => ({ employeeId: employeeId!, locationId })),
          skipDuplicates: true,
        });
      } else {
        // si mandas [], asegúrate de no dejar restos
        await tx.employeeLocation.deleteMany({ where: { employeeId: employeeId! } });
      }

      // === Sincronizar roles ===
      // Igual que ubicaciones; además, marcamos el primero como isPrimary=true
      await tx.employeeRole.deleteMany({
        where: {
          employeeId: employeeId!,
          ...(rIds.length > 0 ? { roleId: { notIn: rIds } } : {}),
        },
      });

      if (rIds.length > 0) {
        // Aseguramos que solo 1 sea primario:
        // primero ponemos todo a false, luego marcamos el primero como true
        await tx.employeeRole.updateMany({
          where: { employeeId: employeeId! },
          data: { isPrimary: false },
        });

        // crea los que falten (todos isPrimary:false de inicio)
        await tx.employeeRole.createMany({
          data: rIds.map((roleId) => ({
            employeeId: employeeId!,
            roleId,
            isPrimary: false,
          })),
          skipDuplicates: true,
        });

        // establece primario el primero del array
        await tx.employeeRole.update({
          where: { employeeId_roleId: { employeeId: employeeId!, roleId: rIds[0] } },
          data: { isPrimary: true },
        });
      } else {
        await tx.employeeRole.deleteMany({ where: { employeeId: employeeId! } });
      }
    });

    return NextResponse.json({ ok: true, id: employeeId }, { status: id ? 200 : 201 });
  } catch (err: any) {
    const msg = err?.message ?? "Error";
    const status = msg.includes("no encontrado") ? 404 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
