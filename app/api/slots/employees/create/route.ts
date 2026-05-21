// app/api/slots/employees/create/route.ts
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

    const locationId = normalizeText(body?.locationId);
    const name = normalizeText(body?.name);
    const jobTitle = normalizeText(body?.jobTitle);
    const color = normalizeText(body?.color);

    if (!locationId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing locationId",
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

    const locationExists = await prisma.location.findUnique({
      where: {
        id: locationId,
      },
      select: {
        id: true,
      },
    });

    if (!locationExists) {
      return NextResponse.json(
        {
          ok: false,
          error: "La ubicación no existe.",
        },
        { status: 404 },
      );
    }

    const employee = await prisma.employee.create({
      data: {
        name,
        job_title: jobTitle || null,
        color: color || null,
        active: true,
        locations: {
          create: {
            locationId,
            visibleInLocation: true,
            isPrimary: false,
            allowCrossLocationBooking: false,
          },
        },
      },
      select: {
        id: true,
        name: true,
        job_title: true,
        color: true,
        active: true,
      },
    });

    return NextResponse.json({
      ok: true,
      employee: {
        id: employee.id,
        name: employee.name,
        role: employee.job_title || "Sin especialidad",
        color: employee.color || "",
        active: employee.active,
      },
    });
  } catch (error) {
    console.error("[slots/employees/create] POST", error);

    return NextResponse.json(
      {
        ok: false,
        error: "No se pudo crear el empleado.",
      },
      { status: 500 },
    );
  }
}