// app/api/services/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 }
      );
    }

    const locationId = req.nextUrl.searchParams.get("locationId")?.trim();

    if (!locationId) {
      return NextResponse.json(
        { ok: false, error: "locationId_required" },
        { status: 400 }
      );
    }

    const location = await prisma.location.findUnique({
      where: { id: locationId },
      select: {
        id: true,
        companyId: true,
      },
    });

    if (!location) {
      return NextResponse.json(
        { ok: false, error: "location_not_found" },
        { status: 404 }
      );
    }

    const isAdmin = (user.role ?? "").toLowerCase() === "system_admin";

    if (!isAdmin) {
      const membership = await prisma.userCompany.findFirst({
        where: {
          userId: user.id,
          companyId: location.companyId,
        },
        select: { id: true },
      });

      if (!membership) {
        return NextResponse.json(
          { ok: false, error: "forbidden" },
          { status: 403 }
        );
      }
    }

    const services = await prisma.service.findMany({
      where: {
        locationId: location.id,
        active: true,
      },
      orderBy: [
        { price: "desc" },
        { durationMin: "asc" },
        { name: "asc" },
      ],
      select: {
        id: true,
        name: true,
        price: true,
        durationMin: true,
        active: true,
      },
    });

    return NextResponse.json({
      ok: true,
      services: services.map((service) => {
        return {
          id: service.id,
          name: service.name,
          price: Number(service.price),
          durationMin: service.durationMin,
          active: service.active,
        };
      }),
    });
  } catch (error) {
    console.error("[GET /api/services/list]", error);

    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}