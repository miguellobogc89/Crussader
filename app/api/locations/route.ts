// app/api/locations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

export const dynamic = "force-dynamic";
const prisma = new PrismaClient();

/**
 * GET /api/locations?companyId=...
 * Devuelve ubicaciones de esa empresa + métricas básicas desde Location.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");
    if (!companyId) {
      return NextResponse.json(
        { ok: false, error: "companyId_required" },
        { status: 400 }
      );
    }

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

    const isAdmin =
      (user.role ?? "").toLowerCase() === "system_admin";

    if (!isAdmin) {
      const membership = await prisma.userCompany.findFirst({
        where: { userId: user.id, companyId },
        select: { id: true },
      });
      if (!membership) {
        return NextResponse.json(
          { ok: false, error: "forbidden" },
          { status: 403 }
        );
      }
    }

    const locations = await prisma.location.findMany({
      where: { companyId },
      select: {
        id: true,
        title: true,
        city: true,
        address: true,
        postalCode: true,
        country: true,
        featuredImageUrl: true,
        status: true,
        reviewsAvg: true,
        reviewsCount: true,
      },
      orderBy: { title: "asc" },
    });

    const enriched = locations.map((l) => ({
      id: l.id,
      title: l.title,
      city: l.city,
      address: l.address,
      postalCode: l.postalCode,
      country: l.country,
      featuredImageUrl: l.featuredImageUrl,
      status: l.status,
      reviewsAvg: l.reviewsAvg ? Number(l.reviewsAvg) : null,
      reviewsCount: l.reviewsCount ?? 0,
      pendingResponses: 0, // rellenaremos más adelante si quieres
    }));

    return NextResponse.json({ ok: true, locations: enriched });
  } catch (e) {
    console.error("[GET /api/locations]", e);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}
