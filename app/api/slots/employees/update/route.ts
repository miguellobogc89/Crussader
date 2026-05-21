// app/api/slots/employees/update/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizeText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const employeeId = normalizeText(body?.employeeId);
    const name = normalizeText(body?.name);
    const title = normalizeText(body?.title);
    const firstName = normalizeText(body?.firstName);
    const lastName = normalizeText(body?.lastName);
    const jobTitle = normalizeText(body?.jobTitle);
    const color = normalizeText(body?.color);
    const email = normalizeText(body?.email);
    const phone = normalizeText(body?.phone);

    let active = true;
    if (typeof body?.active === "boolean") {
      active = body.active;
    }

    if (!employeeId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing employeeId",
        },
        { status: 400 },
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          ok: false,
          error: "El nombre es obligatorio.",
        },
        { status: 400 },
      );
    }

    const employeeExists = await prisma.employee.findUnique({
      where: {
        id: employeeId,
      },
      select: {
        id: true,
      },
    });

    if (!employeeExists) {
      return NextResponse.json(
        {
          ok: false,
          error: "El empleado no existe.",
        },
        { status: 404 },
      );
    }

    const employee = await prisma.employee.update({
      where: {
        id: employeeId,
      },
      data: {
        name,
        title: title || null,
        first_name: firstName || null,
        last_name: lastName || null,
        job_title: jobTitle || null,
        color: color || null,
        email: email || null,
        phone: phone || null,
        active,
      },
      select: {
        id: true,
        name: true,
        title: true,
        first_name: true,
        last_name: true,
        job_title: true,
        color: true,
        email: true,
        phone: true,
        active: true,
        invited_at: true,
        joined_at: true,
      },
    });

    return NextResponse.json({
      ok: true,
      employee: {
        id: employee.id,
        name: employee.name,
        title: employee.title ?? "",
        firstName: employee.first_name ?? "",
        lastName: employee.last_name ?? "",
        role: employee.job_title ?? "Sin especialidad",
        color: employee.color ?? "",
        email: employee.email ?? "",
        phone: employee.phone ?? "",
        active: employee.active,
        invitedAt: employee.invited_at,
        joinedAt: employee.joined_at,
      },
    });
  } catch (error: any) {
    console.error("[slots/employees/update] POST", error);

    if (error?.code === "P2002") {
      return NextResponse.json(
        {
          ok: false,
          error: "Ya existe un empleado con ese email.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: "No se pudo actualizar el empleado.",
      },
      { status: 500 },
    );
  }
}