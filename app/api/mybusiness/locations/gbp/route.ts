import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/db";

export const runtime = "nodejs";

function mapStarRatingToInt(star: string | null | undefined): number {
  if (!star) return 0;
  const v = star.toString().trim().toUpperCase();

  if (v === "ONE") return 1;
  if (v === "TWO") return 2;
  if (v === "THREE") return 3;
  if (v === "FOUR") return 4;
  if (v === "FIVE") return 5;

  const num = Number(v);
  if (!Number.isNaN(num) && num >= 1 && num <= 5) return num;

  return 0;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const companyId = url.searchParams.get("companyId") ?? "";

  if (!companyId.trim()) {
    return NextResponse.json(
      {
        ok: false,
        error: "missing_company_id",
        account: null,
        locations: [],
      },
      { status: 400 },
    );
  }

  try {
    // 1) Cuenta GBP para esta company (la más reciente)
    const account = await prisma.google_gbp_account.findFirst({
      where: { company_id: companyId },
      orderBy: { created_at: "desc" },
    });

    if (!account) {
      return NextResponse.json(
        {
          ok: true,
          error: "no_gbp_account_for_company",
          account: null,
          locations: [],
        },
        { status: 200 },
      );
    }

    // 2) Locations GBP que cuelgan de esa cuenta
    const locations = await prisma.google_gbp_location.findMany({
      where: {
        company_id: companyId,
        account_id: account.id,
      },
      orderBy: { created_at: "asc" },
    });

    if (locations.length === 0) {
      return NextResponse.json(
        {
          ok: true,
          account: {
            id: account.id,
            googleAccountId: account.google_account_id,
            name: account.google_account_name ?? null,
            avgRating: null,
            reviewCount: null,
          },
          locations: [],
        },
        { status: 200 },
      );
    }

    const locationIds = locations.map((l) => l.id);

    // 3) Todas las reviews de estas locations en google_gbp_reviews
    const allReviews = await prisma.google_gbp_reviews.findMany({
      where: {
        company_id: companyId,
        gbp_location_id: { in: locationIds },
      },
      select: {
        gbp_location_id: true,
        star_rating: true,
      },
    });

    // 4) Agregar stats por location y a nivel de cuenta
    const perLocation: Record<
      string,
      { sum: number; count: number }
    > = {};

    let accountSum = 0;
    let accountCount = 0;

    for (const r of allReviews) {
      const locId = r.gbp_location_id;
      if (!locId) continue;

      const rating = mapStarRatingToInt(r.star_rating);
      if (rating <= 0) continue;

      if (!perLocation[locId]) {
        perLocation[locId] = { sum: 0, count: 0 };
      }
      perLocation[locId].sum += rating;
      perLocation[locId].count += 1;

      accountSum += rating;
      accountCount += 1;
    }

    const enrichedLocations = locations.map((loc) => {
      const stats = perLocation[loc.id];
      const avgRating =
        stats && stats.count > 0 ? stats.sum / stats.count : null;
      const reviewCount = stats ? stats.count : null;

      return {
        id: loc.id,
        googleLocationId: loc.google_location_id,
        title:
          loc.title ??
          loc.google_location_title ??
          loc.google_location_name ??
          null,
        address: loc.address ?? null,
        status: loc.status ?? null,
        linkedLocationId: loc.location_id ?? null,
        avgRating,
        reviewCount,
      };
    });

    const accountAvg =
      accountCount > 0 ? accountSum / accountCount : null;
    const accountReviewCount = accountCount > 0 ? accountCount : null;

    return NextResponse.json(
      {
        ok: true,
        account: {
          id: account.id,
          googleAccountId: account.google_account_id,
          name: account.google_account_name ?? null,
          avgRating: accountAvg,
          reviewCount: accountReviewCount,
        },
        locations: enrichedLocations,
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("[mybusiness][locations][gbp][GET] error", err);
    return NextResponse.json(
      {
        ok: false,
        error: "internal_error",
        details: err?.message ?? String(err),
        account: null,
        locations: [],
      },
      { status: 500 },
    );
  }
}
