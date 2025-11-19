// app/api/mybusiness/locations/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LocationStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET solo para probar rápido en navegador (opcional)
export async function GET() {
  console.log("[locations/create][GET] endpoint reached");
  return NextResponse.json({ ok: true, message: "locations/create alive" });
}

export async function POST(req: NextRequest) {
  try {
    console.log("[locations/create][POST] start");

    const session = (await getServerSession(authOptions)) as any;

    if (!session?.user?.id) {
      console.error("[locations/create] no_session");
      return NextResponse.json(
        { ok: false, error: "no_session" },
        { status: 401 },
      );
    }

    const userId = session.user.id;
    console.log("[locations/create] userId:", userId);

    // 1) Última empresa del usuario en UserCompany
    const userCompany = await prisma.userCompany.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (!userCompany) {
      console.error(
        "[locations/create] no_company_for_user, userId:",
        userId,
      );
      return NextResponse.json(
        { ok: false, error: "no_company_for_user" },
        { status: 400 },
      );
    }

    const companyId = userCompany.companyId;
    console.log("[locations/create] using companyId:", companyId);

    // 2) Datos de la ubicación enviados desde el onboarding
    const body = await req.json();
    console.log("[locations/create] body:", body);

    const {
      title,
      address,
      city,
      postalCode,
      phone,
      website,
      activityId,
      typeId,
    } = body as {
      title?: string;
      address?: string;
      city?: string;
      postalCode?: string;
      phone?: string;
      website?: string;
      activityId?: string;
      typeId?: string;
    };

    if (!title) {
      console.error("[locations/create] missing_title");
      return NextResponse.json(
        { ok: false, error: "missing_title" },
        { status: 400 },
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

    console.log(
      "[locations/create] created",
      location.id,
      "for company",
      companyId,
    );

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
