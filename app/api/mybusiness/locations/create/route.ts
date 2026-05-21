// app/api/mybusiness/locations/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LocationStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  console.log("[locations/create][GET] endpoint reached");
  return NextResponse.json({ ok: true, message: "locations/create alive" });
}

export async function POST(req: NextRequest) {
  try {
    console.log("[locations/create][POST] start");

    const session = (await getServerSession(authOptions)) as any;

    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, error: "no_session" },
        { status: 401 },
      );
    }

    const userId = session.user.id;

    const body = await req.json();
    console.log("[locations/create] body:", body);

    const {
      companyId,
      title,
      address,
      city,
      postalCode,
      phone,
      website,
      activityId,
      typeId,
    } = body as {
      companyId?: string;
      title?: string;
      address?: string;
      city?: string;
      postalCode?: string;
      phone?: string;
      website?: string;
      activityId?: string;
      typeId?: string;
    };

    if (!companyId) {
      return NextResponse.json(
        { ok: false, error: "missing_company_id" },
        { status: 400 },
      );
    }

    if (!title) {
      return NextResponse.json(
        { ok: false, error: "missing_title" },
        { status: 400 },
      );
    }

    const userCompany = await prisma.userCompany.findFirst({
      where: {
        userId,
        companyId,
      },
      select: {
        id: true,
      },
    });

    if (!userCompany) {
      return NextResponse.json(
        { ok: false, error: "user_not_in_company" },
        { status: 403 },
      );
    }

    const location = await prisma.location.create({
      data: {
        companyId,
        title: title.trim(),
        address: address?.trim() || undefined,
        city: city?.trim() || undefined,
        postalCode: postalCode?.trim() || undefined,
        phone: phone?.trim() || undefined,
        website: website?.trim() || undefined,
        activityId,
        typeId,
        status: LocationStatus.ACTIVE,
      },
    });

    await prisma.userLocation.upsert({
      where: {
        userId_locationId: {
          userId,
          locationId: location.id,
        },
      },
      update: {
        role: "MANAGER",
      },
      create: {
        userId,
        locationId: location.id,
        role: "MANAGER",
      },
    });

    return NextResponse.json(
      {
        ok: true,
        locationId: location.id,
        location,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[locations/create] Error:", err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 },
    );
  }
}