// app/api/integrations/google/business-profile/reviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { google } from "googleapis";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const companyId = req.nextUrl.searchParams.get("companyId")?.trim();

    if (!companyId) {
      return NextResponse.json(
        { ok: false, error: "missing_company_id" },
        { status: 400 }
      );
    }

    const provider = "google-business";

    // 1) ExternalConnection GOOGLE BUSINESS de esa company
    const ext = await prisma.externalConnection.findFirst({
      where: { companyId, provider },
      orderBy: { createdAt: "desc" },
    });

    if (!ext) {
      return NextResponse.json(
        { ok: false, error: "no_external_connection" },
        { status: 404 }
      );
    }

    if (!ext.access_token && !ext.refresh_token) {
      return NextResponse.json(
        { ok: false, error: "no_tokens_for_connection" },
        { status: 400 }
      );
    }

    // 2) Resolver access_token válido
    const redirectUri =
      process.env.GOOGLE_BUSINESS_REDIRECT_URI ||
      `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/business-profile/callback`;

    const client = new google.auth.OAuth2(
      process.env.GOOGLE_BUSINESS_CLIENT_ID!,
      process.env.GOOGLE_BUSINESS_CLIENT_SECRET!,
      redirectUri
    );

    let accessToken = ext.access_token ?? null;

    const nowSec = Math.floor(Date.now() / 1000);
    const isExpired =
      typeof ext.expires_at === "number" && ext.expires_at < nowSec - 60;

    if ((!accessToken || isExpired) && ext.refresh_token) {
      try {
        client.setCredentials({ refresh_token: ext.refresh_token });
        const newTokenResp = await client.getAccessToken();
        const newAccessToken = newTokenResp?.token ?? null;

        if (!newAccessToken) {
          throw new Error("empty_access_token_after_refresh");
        }

        accessToken = newAccessToken;

        const expiryMs = client.credentials.expiry_date;
        const newExpiresAtSec =
          typeof expiryMs === "number"
            ? Math.floor(expiryMs / 1000)
            : null;

        await prisma.externalConnection.update({
          where: { id: ext.id },
          data: {
            access_token: newAccessToken,
            expires_at: newExpiresAtSec ?? undefined,
          },
        });
      } catch (err) {
        console.error("[GBP][reviews] error refreshing token:", err);
        return NextResponse.json(
          { ok: false, error: "token_refresh_failed" },
          { status: 401 }
        );
      }
    }

    if (!accessToken) {
      return NextResponse.json(
        { ok: false, error: "no_valid_access_token" },
        { status: 401 }
      );
    }

    // 3) Todas las google_gbp_location activas de esa company
    const gbpLocations = await prisma.google_gbp_location.findMany({
      where: {
        company_id: companyId,
        status: "active",
      },
      include: {
        google_gbp_account: true,
      },
    });

    if (!gbpLocations || gbpLocations.length === 0) {
      return NextResponse.json({
        ok: true,
        synced: {
          locations: 0,
          reviewsUpserted: 0,
          perLocation: [],
        },
        warning: "No hay google_gbp_location activas para esa company",
      });
    }

    // Map de rating enum → string que guardamos tal cual
    const starMap: Record<string, string> = {
      ONE: "ONE",
      TWO: "TWO",
      THREE: "THREE",
      FOUR: "FOUR",
      FIVE: "FIVE",
    };

    let totalUpserted = 0;
    const perLocation: Array<{
      gbpLocationId: string;
      google_location_id: string;
      upserted: number;
    }> = [];

    // 4) Por cada ubicación GBP, llamar al endpoint v4 de reviews y upsert
    for (const loc of gbpLocations) {
      const account = loc.google_gbp_account;
      if (!account || !account.google_account_id) {
        perLocation.push({
          gbpLocationId: loc.id,
          google_location_id: loc.google_location_id,
          upserted: 0,
        });
        continue;
      }

      let googleAccountName = account.google_account_id.trim();
      if (!googleAccountName.startsWith("accounts/")) {
        googleAccountName = `accounts/${googleAccountName}`;
      }

      const basePath = `https://mybusiness.googleapis.com/v4/${googleAccountName}/locations/${loc.google_location_id}/reviews`;

      let pageToken: string | undefined = undefined;
      let upsertedForLoc = 0;

      // Paginación v4
      while (true) {
        let url = basePath;
        if (pageToken) {
          url += `?pageToken=${encodeURIComponent(pageToken)}`;
        }

        const resp = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!resp.ok) {
          const text = await resp.text().catch(() => "");
          console.error(
            "[GBP][reviews] Google API error",
            resp.status,
            text
          );
          break;
        }

        const data = (await resp.json()) as any;
        const reviews = Array.isArray(data.reviews) ? data.reviews : [];
        const averageRating =
          typeof data.averageRating === "number" ? data.averageRating : null;
        const totalReviewCount =
          typeof data.totalReviewCount === "number"
            ? data.totalReviewCount
            : null;

        for (const r of reviews) {
          // --- Campos básicos del JSON ---
          const reviewId: string =
            typeof r.reviewId === "string"
              ? r.reviewId
              : typeof r.name === "string"
              ? String(r.name).split("/").pop() ?? ""
              : "";

          if (!reviewId) continue;

          const resourceName: string =
            typeof r.name === "string" ? r.name : `reviews/${reviewId}`;

          const reviewerName: string | null =
            r.reviewer?.displayName ?? null;
          const reviewerPhoto: string | null =
            r.reviewer?.profilePhotoUrl ?? null;

          const starRatingStr: string | null =
            typeof r.starRating === "string" ? r.starRating : null;
          const starRating: string =
            (starRatingStr && starMap[starRatingStr]) || "UNKNOWN";

          const comment: string | null =
            typeof r.comment === "string" ? r.comment : null;

          // Tu modelo requiere DateTime no opcionales → siempre ponemos Date válida
          const createTime: Date =
            r.createTime ? new Date(r.createTime) : new Date();
          const updateTime: Date =
            r.updateTime ? new Date(r.updateTime) : createTime;

          // --- UPSERT respetando tu unique (company_id, google_review_id) ---
          await prisma.google_gbp_reviews.upsert({
            where: {
              company_id_google_review_id: {
                company_id: companyId,
                google_review_id: reviewId,
              },
            },
            create: {
              company_id: companyId,
              location_id: loc.location_id ?? null,
              gbp_location_id: loc.id,
              google_review_id: reviewId,
              resource_name: resourceName,
              reviewer_display_name: reviewerName ?? undefined,
              reviewer_profile_photo_url: reviewerPhoto ?? undefined,
              star_rating: starRating,
              comment: comment ?? undefined,
              create_time: createTime,
              update_time: updateTime,
              average_rating: averageRating ?? undefined,
              total_review_count: totalReviewCount ?? undefined,
            },
            update: {
              location_id: loc.location_id ?? null,
              gbp_location_id: loc.id,
              resource_name: resourceName,
              reviewer_display_name: reviewerName ?? undefined,
              reviewer_profile_photo_url: reviewerPhoto ?? undefined,
              star_rating: starRating,
              comment: comment ?? undefined,
              create_time: createTime,
              update_time: updateTime,
              average_rating: averageRating ?? undefined,
              total_review_count: totalReviewCount ?? undefined,
            },
          });

          upsertedForLoc += 1;
        }

        if (typeof data.nextPageToken === "string" && data.nextPageToken) {
          pageToken = data.nextPageToken;
        } else {
          break;
        }
      }

      totalUpserted += upsertedForLoc;
      perLocation.push({
        gbpLocationId: loc.id,
        google_location_id: loc.google_location_id,
        upserted: upsertedForLoc,
      });
    }

    return NextResponse.json({
      ok: true,
      synced: {
        locations: gbpLocations.length,
        reviewsUpserted: totalUpserted,
        perLocation,
      },
    });
  } catch (err) {
    console.error("[GBP][reviews] unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: "unexpected_error" },
      { status: 500 }
    );
  }
}
