// app/api/calendar/employees/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let prisma: PrismaClient;
declare global {
  // eslint-disable-next-line no-var
  var _prisma: PrismaClient | undefined;
}
if (!global._prisma) global._prisma = new PrismaClient();
prisma = global._prisma;

function uniqStrings(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const x of v) {
    const s = String(x ?? "").trim();
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

/** Paleta para colores consistentes (puedes ajustarla cuando quieras) */
const COLOR_POOL = [
  "#EF4444",
  "#F97316",
  "#F59E0B",
  "#EAB308",
  "#84CC16",
  "#22C55E",
  "#10B981",
  "#14B8A6",
  "#06B6D4",
  "#0EA5E9",
  "#3B82F6",
  "#6366F1",
  "#8B5CF6",
  "#A855F7",
  "#D946EF",
  "#EC4899",
];

function pickUniqueColor(used: Set<string>): string {
  const available = COLOR_POOL.filter((c) => !used.has(c));
  if (available.length > 0) {
    const idx = Math.floor(Math.random() * available.length);
    return available[idx];
  }

  // Si se agota la paleta, fallback best-effort evitando colisión
  for (let i = 0; i < 30; i++) {
    const c =
      "#" + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");
    if (!used.has(c)) return c;
  }
  return "#999999";
}

function slugifyRoleName(input: string): string {
  const s = input.trim().toLowerCase();

  // sin depender de libs: normaliza acentos (compat), deja alfanum + guión
  const noAccents = s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const dashed = noAccents
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return dashed || "role";
}

/**
 * GET /api/calendar/employees?locationId=...
 * Lista empleados de una ubicación con roles (y rol primario de comodidad).
 * SOLO ACTIVOS.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const locationId = url.searchParams.get("locationId");

  if (!locationId) {
    return NextResponse.json({ error: "Missing locationId" }, { status: 400 });
  }

  const rows = await prisma.employee.findMany({
    where: {
      active: true, // ✅ solo activos
      locations: { some: { locationId: String(locationId) } },
    },
    select: {
      id: true,
      name: true,
      active: true,
      color: true,
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
      color: e.color ?? null,
      roles,
      primaryRoleName: primary?.role.name ?? null,
      primaryRoleColor: primary?.role.color ?? null,
    };
  });

  return NextResponse.json({ items }, { status: 200 });
}

/**
 * POST /api/calendar/employees
 * Crea o actualiza un empleado y sincroniza ubicaciones/roles.
 *
 * Body:
 *  - id?: string
 *  - name: string
 *  - active?: boolean
 *  - locationIds?: string[]
 *  - roleIds?: string[]   (opcional, tu UI actual no lo usa)
 *  - roleText?: string    (✅ UI actual)
 *  - jobTitle?: string
 */
export async function POST(req: NextRequest) {
  try {
    const body: any = await req.json().catch(() => ({}));

    const id = typeof body?.id === "string" ? body.id : undefined;
    const name = typeof body?.name === "string" ? body.name : "";
    const active = typeof body?.active === "boolean" ? body.active : true;

    const roleText =
      typeof body?.roleText === "string" ? body.roleText.trim() : "";

    const locIds = uniqStrings(body?.locationIds);
    const rIds = uniqStrings(body?.roleIds);

    const jobTitle = typeof body?.jobTitle === "string" ? body.jobTitle : null;
    const job_title = jobTitle ? jobTitle.trim().slice(0, 64) : null;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { ok: false, error: "Falta 'name' válido" },
        { status: 400 }
      );
    }

    let employeeId: string | undefined = id;

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1) create / update empleado
      if (!employeeId) {
        // ✅ color único para empleado
        const existing = await tx.employee.findMany({
          select: { color: true },
        });
        const used = new Set<string>(
          existing
            .map((e) => (e.color ? String(e.color) : ""))
            .filter(Boolean)
        );

        const created = await tx.employee.create({
          data: {
            name: name.trim(),
            active,
            job_title,
            color: pickUniqueColor(used),
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
            active,
            job_title,
          },
        });
      }

      const eid = employeeId as string;

      // 2) sincronizar ubicaciones
      if (locIds.length === 0) {
        await tx.employeeLocation.deleteMany({ where: { employeeId: eid } });
      } else {
        await tx.employeeLocation.deleteMany({
          where: {
            employeeId: eid,
            locationId: { notIn: locIds },
          },
        });

        await tx.employeeLocation.createMany({
          data: locIds.map((locationId) => ({
            employeeId: eid,
            locationId,
          })),
          skipDuplicates: true,
        });
      }

      // 3) roles:
      // - Tu UI actual manda roleText (string). Si viene, lo hacemos primario.
      // - Si además en el futuro pasas roleIds, puedes expandir esta parte.
      if (roleText) {
        const slug = slugifyRoleName(roleText);

        // ✅ color único para rol SOLO si se crea
        const existingRoles = await tx.staffRole.findMany({
          select: { color: true },
        });
        const usedRoleColors = new Set<string>(
          existingRoles
            .map((r) => (r.color ? String(r.color) : ""))
            .filter(Boolean)
        );

        const role = await tx.staffRole.upsert({
          where: { slug },
          update: { name: roleText, active: true },
          create: {
            name: roleText,
            slug,
            active: true,
            color: pickUniqueColor(usedRoleColors),
          },
          select: { id: true },
        });

        await tx.employeeRole.updateMany({
          where: { employeeId: eid },
          data: { isPrimary: false },
        });

        await tx.employeeRole.upsert({
          where: { employeeId_roleId: { employeeId: eid, roleId: role.id } },
          update: { isPrimary: true },
          create: { employeeId: eid, roleId: role.id, isPrimary: true },
        });
      } else if (rIds.length > 0) {
        // Si algún día vuelves a usar roleIds, mantengo compat.
        await tx.employeeRole.deleteMany({
          where: {
            employeeId: eid,
            roleId: { notIn: rIds },
          },
        });

        await tx.employeeRole.updateMany({
          where: { employeeId: eid },
          data: { isPrimary: false },
        });

        await tx.employeeRole.createMany({
          data: rIds.map((roleId) => ({
            employeeId: eid,
            roleId,
            isPrimary: false,
          })),
          skipDuplicates: true,
        });

        await tx.employeeRole.update({
          where: { employeeId_roleId: { employeeId: eid, roleId: rIds[0] } },
          data: { isPrimary: true },
        });
      }
    });

    return NextResponse.json(
      { ok: true, id: employeeId },
      { status: id ? 200 : 201 }
    );
  } catch (err: any) {
    const msg = err?.message ?? "Error";
    const status = msg.includes("no encontrado") ? 404 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
