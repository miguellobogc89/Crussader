// app/api/integrations/google/business-profile/sync/reviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getExternalConnectionForCompany,
  getValidAccessToken,
  listGbpReviewsForLocation,
} from "@/lib/integrations/google-business/client";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const companyId = (body?.companyId as string | undefined)?.trim();

    if (!companyId) {
      return NextResponse.json(
        { ok: false, error: "missing_company_id" },
        { status: 400 },
      );
    }

    // 1) ExternalConnection + accessToken válido
    const ext = await getExternalConnectionForCompany(companyId);
    const accessToken = await getValidAccessToken(ext);

    // 2) Cuenta GBP (para tener google_account_id)
    const gbpAccount = await prisma.google_gbp_account.findFirst({
      where: {
        company_id: companyId,
        external_connection_id: ext.id,
      },
      orderBy: { created_at: "desc" },
    });

    if (!gbpAccount || !gbpAccount.google_account_id) {
      return NextResponse.json(
        {
          ok: false,
          error: "no_gbp_account_for_company_and_connection",
        },
        { status: 404 },
      );
    }

    const accountId = gbpAccount.google_account_id.trim();

    // 3) Todas las locations sincronizadas para esta company
    const locations = await prisma.google_gbp_location.findMany({
      where: { company_id: companyId },
      select: {
        id: true,                  // UUID de google_gbp_location
        google_location_id: true,  // resource name o id
      },
    });

    if (!locations.length) {
      return NextResponse.json({
        ok: true,
        totalLocations: 0,
        totalReviews: 0,
        upserted: 0,
      });
    }

    // Helper: resourceName correcto para v4
    function buildLocationResourceName(googleLocationId: string): string {
      const trimmed = googleLocationId.trim();
      if (!trimmed) {
        throw new Error("[GBP][reviews] empty google_location_id");
      }

      if (trimmed.startsWith("accounts/")) {
        return trimmed;
      }

      if (trimmed.startsWith("locations/")) {
        return `accounts/${accountId}/${trimmed}`;
      }

      return `accounts/${accountId}/locations/${trimmed}`;
    }

    let totalReviews = 0;
    let upsertedCount = 0;

    // 4) Transaction para upserts de TODAS las reviews
    await prisma.$transaction(async (tx) => {
      for (const loc of locations) {
        if (!loc.google_location_id) continue;

        const locationResourceName = buildLocationResourceName(
          loc.google_location_id,
        );

        let pageToken: string | undefined = undefined;

        do {
          const { reviews, nextPageToken } = await listGbpReviewsForLocation({
            locationResourceName,
            accessToken,
            pageToken,
          });

          for (const rev of reviews) {
            totalReviews += 1;

            const resourceName: string =
              typeof rev.name === "string" ? rev.name : "";
            if (!resourceName) {
              continue;
            }

            // google_review_id: usamos reviewId si viene, si no el resourceName
            const googleReviewId: string =
              typeof rev.reviewId === "string" && rev.reviewId.trim().length > 0
                ? rev.reviewId.trim()
                : resourceName;

            // star_rating es STRING en el modelo
            let starRating: string = "STAR_RATING_UNSPECIFIED";
            if (typeof rev.starRating === "string") {
              starRating = rev.starRating;
            } else if (typeof rev.starRating === "number") {
              starRating = String(rev.starRating);
            }

            const comment: string | null =
              typeof rev.comment === "string" && rev.comment.trim().length > 0
                ? rev.comment.trim()
                : null;


            const reviewerDisplayName: string | null =
              typeof rev.reviewer?.displayName === "string"
                ? rev.reviewer.displayName
                : null;

            const reviewerProfilePhotoUrl: string | null =
              typeof rev.reviewer?.profilePhotoUrl === "string"
                ? rev.reviewer.profilePhotoUrl
                : null;

            const createTimeStr: string | null =
              typeof rev.createTime === "string" ? rev.createTime : null;
            const updateTimeStr: string | null =
              typeof rev.updateTime === "string" ? rev.updateTime : null;

            const now = new Date();

            const createTime =
              createTimeStr && !Number.isNaN(Date.parse(createTimeStr))
                ? new Date(createTimeStr)
                : now;

            const updateTime =
              updateTimeStr && !Number.isNaN(Date.parse(updateTimeStr))
                ? new Date(updateTimeStr)
                : now;

            const record = await tx.google_gbp_reviews.upsert({
              where: {
                company_id_google_review_id: {      // <-- ESTE es el bueno
                  company_id: companyId,
                  google_review_id: googleReviewId,
                },
              },
              create: {
                company_id: companyId,
                location_id: null,
                gbp_location_id: loc.id,
                google_review_id: googleReviewId,
                resource_name: resourceName,
                reviewer_display_name: reviewerDisplayName ?? undefined,
                reviewer_profile_photo_url: reviewerProfilePhotoUrl ?? undefined,
                star_rating: starRating,
                comment: comment ?? undefined,
                create_time: createTime,
                update_time: updateTime,
                average_rating: null,
                total_review_count: null,
                created_at: now,
                updated_at: now,
              },
              update: {
                location_id: null,
                gbp_location_id: loc.id,
                resource_name: resourceName,
                reviewer_display_name: reviewerDisplayName ?? undefined,
                reviewer_profile_photo_url: reviewerProfilePhotoUrl ?? undefined,
                star_rating: starRating,
                comment: comment ?? undefined,
                create_time: createTime,
                update_time: updateTime,
                updated_at: now,
              },
            });


            if (record) {
              upsertedCount += 1;
            }
          }

          pageToken = nextPageToken;
        } while (pageToken);
      }
    });

    return NextResponse.json({
      ok: true,
      totalLocations: locations.length,
      totalReviews,
      upserted: upsertedCount,
    });
  } catch (err) {
    console.error("[GBP][sync/reviews] unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: "unexpected_error" },
      { status: 500 },
    );
  }
}
