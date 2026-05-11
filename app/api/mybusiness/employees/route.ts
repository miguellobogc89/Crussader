// app/api/mybusiness/employees/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/db";
import { getBootstrapData } from "@/lib/bootstrap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/mybusiness/employees
 *
 * - ?locationId=xxx → empleados de esa ubicación
 * - sin locationId → empleados de la company activa
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);

    const locationId =
      url.searchParams.get("locationId");

    const companyId =
      url.searchParams.get("companyId");

    let whereClause: any;

    if (locationId) {
      whereClause = {
        locations: {
          some: {
            locationId: String(locationId),
          },
        },
      };
    } else {
      const bootstrap = await getBootstrapData();

      const activeCompanyId =
        companyId ??
        bootstrap.sessionContext?.companyId ??
        bootstrap.activeCompanyResolved?.id ??
        bootstrap.activeCompany?.id ??
        null;

      if (!activeCompanyId) {
        return NextResponse.json(
          { error: "No active company in session" },
          { status: 401 },
        );
      }

      whereClause = {
        locations: {
          some: {
            location: {
              companyId: activeCompanyId,
            },
          },
        },
      };
    }

    console.log("[EMPLOYEES_API_DEBUG]", {
  locationId,
  companyId,
  activeCompanyId:
    companyId ??
    "fallback-bootstrap",
  whereClause,
});

    const rows = await prisma.employee.findMany({
      where: whereClause,

      select: {
        id: true,
        name: true,

        first_name: true,
        last_name: true,
        email: true,
        phone: true,

        color: true,
        job_title: true,
        title: true,

        active: true,
        timezone: true,
        notes: true,

        invited_at: true,
joined_at: true,

        locations: {
          select: {
            isPrimary: true,
            visibleInLocation: true,
            allowCrossLocationBooking: true,

            location: {
              select: {
                id: true,
                title: true,
                companyId: true,
                city: true,
                timezone: true,
              },
            },
          },

          orderBy: [{ isPrimary: "desc" }],
        },

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

          orderBy: [
            { isPrimary: "desc" },
            { role: { name: "asc" } },
          ],
        },

        employee_service: {
          select: {
            id: true,

            slot_recovery_service: {
              select: {
                id: true,
                name: true,
                duration_min: true,
                price: true,
                active: true,
              },
            },
          },
        },
      },

      orderBy: {
        name: "asc",
      },
    });

    console.log("[EMPLOYEES_API_ROWS]", {
  count: rows.length,
  ids: rows.map((e) => e.id),
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

      const primary =
        roles.find((r) => r.isPrimary) ??
        roles[0] ??
        null;

      return {
        id: e.id,

        name: e.name,

        firstName: e.first_name,
        lastName: e.last_name,

        email: e.email,
        phone: e.phone,

        color: e.color,

        jobTitle: e.job_title,
        title: e.title,

        active: e.active,

invitedAt: e.invited_at,
joinedAt: e.joined_at,

timezone: e.timezone,
notes: e.notes,

        locations: e.locations.map((l) => ({
          id: l.location.id,
          title: l.location.title,
          companyId: l.location.companyId,
          city: l.location.city,
          timezone: l.location.timezone,

          isPrimary: l.isPrimary,
          visibleInLocation: l.visibleInLocation,
          allowCrossLocationBooking:
            l.allowCrossLocationBooking,
        })),

        primaryLocation:
          e.locations.find((l) => l.isPrimary)?.location
            .title ??
          e.locations[0]?.location.title ??
          null,

        roles,

        primaryRoleName:
          primary?.role.name ?? null,

        primaryRoleColor:
          primary?.role.color ?? null,

        services: e.employee_service.map((s) => ({
          id: s.slot_recovery_service.id,
          name: s.slot_recovery_service.name,
          durationMin:
            s.slot_recovery_service.duration_min,
          price: s.slot_recovery_service.price,
          active: s.slot_recovery_service.active,
        })),
      };
    });

    return NextResponse.json(
      { items },
      { status: 200 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message ?? "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/mybusiness/employees
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      id,
      title = null,
      firstName = null,
      lastName = null,
      email = null,
      phone = null,
      jobTitle = null,
      color = null,
      active = true,
      locationIds = [],
      roleIds = [],
      serviceIds = [],
    }: {
      id?: string;
      title?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      email?: string | null;
      phone?: string | null;
      jobTitle?: string | null;
      color?: string | null;
      active?: boolean;
      locationIds?: string[];
      roleIds?: string[];
      serviceIds?: string[];
    } = body ?? {};

    const computedName = [
      title,
      firstName,
      lastName,
    ]
      .map((v) => (typeof v === "string" ? v.trim() : ""))
      .filter(Boolean)
      .join(" ");

    if (!computedName) {
      return NextResponse.json(
        { error: "Falta nombre o apellidos válidos" },
        { status: 400 },
      );
    }

    const locIds = Array.isArray(locationIds)
      ? Array.from(new Set(locationIds.map(String).filter(Boolean)))
      : [];

    const rIds = Array.isArray(roleIds)
      ? Array.from(new Set(roleIds.map(String).filter(Boolean)))
      : [];

    const sIds = Array.isArray(serviceIds)
      ? Array.from(new Set(serviceIds.map(String).filter(Boolean)))
      : [];

    let employeeId = id;

    await prisma.$transaction(async (tx) => {
      if (!employeeId) {
        const created = await tx.employee.create({
          data: {
            name: computedName,
            title,
            first_name: firstName,
            last_name: lastName,
            email,
            phone,
            job_title: jobTitle,
            color,
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
            name: computedName,
            title,
            first_name: firstName,
            last_name: lastName,
            email,
            phone,
            job_title: jobTitle,
            color,
            active: !!active,
          },
        });
      }

      await tx.employeeLocation.deleteMany({
        where: {
          employeeId: employeeId!,
          ...(locIds.length > 0
            ? { locationId: { notIn: locIds } }
            : {}),
        },
      });

      if (locIds.length > 0) {
        await tx.employeeLocation.createMany({
          data: locIds.map((locationId) => ({
            employeeId: employeeId!,
            locationId,
          })),
          skipDuplicates: true,
        });
      } else {
        await tx.employeeLocation.deleteMany({
          where: { employeeId: employeeId! },
        });
      }

      await tx.employeeRole.deleteMany({
        where: {
          employeeId: employeeId!,
          ...(rIds.length > 0
            ? { roleId: { notIn: rIds } }
            : {}),
        },
      });

      if (rIds.length > 0) {
        await tx.employeeRole.updateMany({
          where: { employeeId: employeeId! },
          data: { isPrimary: false },
        });

        await tx.employeeRole.createMany({
          data: rIds.map((roleId) => ({
            employeeId: employeeId!,
            roleId,
            isPrimary: false,
          })),
          skipDuplicates: true,
        });

        await tx.employeeRole.update({
          where: {
            employeeId_roleId: {
              employeeId: employeeId!,
              roleId: rIds[0],
            },
          },
          data: { isPrimary: true },
        });
      } else {
        await tx.employeeRole.deleteMany({
          where: { employeeId: employeeId! },
        });
      }

      await tx.employee_service.deleteMany({
        where: {
          employee_id: employeeId!,
          ...(sIds.length > 0
            ? { service_id: { notIn: sIds } }
            : {}),
        },
      });

      if (sIds.length > 0) {
        await tx.employee_service.createMany({
          data: sIds.map((service_id) => ({
            employee_id: employeeId!,
            service_id,
          })),
          skipDuplicates: true,
        });
      } else {
        await tx.employee_service.deleteMany({
          where: { employee_id: employeeId! },
        });
      }
    });

    return NextResponse.json(
      { ok: true, id: employeeId },
      { status: id ? 200 : 201 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message ?? "Error",
      },
      { status: 500 },
    );
  }
}