// app/api/integrations/google/business-profile/locations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json(
        { ok: false, error: "NO_SESSION" },
        { status: 401 },
      );
    }

    const userId = (session.user as any).id as string;

    const body = await req.json().catch(() => null);
    const companyId = (body?.companyId ?? "").trim();

    if (!companyId) {
      return NextResponse.json(
        { ok: false, error: "missing_company_id" },
        { status: 400 },
      );
    }

    // 1) Locations GBP de esta company, SOLO de cuentas conectadas por ESTE usuario
    const rows = await prisma.google_gbp_location.findMany({
      where: {
        company_id: companyId,
        google_gbp_account: {
          ExternalConnection: {
            userId,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    if (rows.length === 0) {
      return NextResponse.json(
        {
          ok: true,
          locations: [],
          total: 0,
        },
        { status: 200 },
      );
    }

    // 2) Stats de reviews por ubicación GBP (media y nº total)
    const gbpLocationIds = rows.map((r) => r.id);

    const stats = await prisma.google_gbp_reviews.groupBy({
      by: ["gbp_location_id"],
      where: {
        company_id: companyId,
        gbp_location_id: { in: gbpLocationIds },
      },
      _avg: {
        average_rating: true,
      },
      _max: {
        total_review_count: true,
      },
    });

    const statsMap = new Map<
      string,
      { averageRating: Prisma.Decimal | null; totalReviewCount: number | null }
    >();

    for (const s of stats) {
      const key = s.gbp_location_id;
      if (!key) continue;

      statsMap.set(key, {
        averageRating: s._avg.average_rating ?? null,
        totalReviewCount: s._max.total_review_count ?? null,
      });
    }

    // 3) Mapear locations incluyendo rating y nº de reseñas
    const locations = rows.map((row) => {
      const s = statsMap.get(row.id);

      const rating =
        s && s.averageRating !== null
          ? Number(s.averageRating)
          : null;

      const totalReviewCount =
        s && typeof s.totalReviewCount === "number"
          ? s.totalReviewCount
          : 0;

      return {
        id: row.id,
        companyId: row.company_id,
        accountId: row.account_id, // camelCase para el front
        googleLocationId: row.google_location_id,
        title: row.title ?? row.google_location_title ?? "Sin nombre",
        address: row.address ?? "",
        status: row.status ?? "available",
        rating,
        totalReviewCount,
      };
    });

    return NextResponse.json(
      {
        ok: true,
        locations,
        total: locations.length,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[GBP][locations] unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: "unexpected_error" },
      { status: 500 },
    );
  }
}
