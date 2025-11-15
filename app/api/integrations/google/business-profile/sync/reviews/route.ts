// app/api/integrations/google/business-profile/sync/reviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

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

    const provider = "google-business";

    // 1) ExternalConnection de GBP para esta company
    const ext = await prisma.externalConnection.findFirst({
      where: { companyId, provider },
      orderBy: { createdAt: "desc" },
    });

    if (!ext) {
      return NextResponse.json(
        { ok: false, error: "no_external_connection" },
        { status: 404 },
      );
    }

    if (!ext.access_token && !ext.refresh_token) {
      return NextResponse.json(
        { ok: false, error: "no_tokens_for_connection" },
        { status: 400 },
      );
    }

    // 2) Cuenta GBP asociada a esa conexión
    const gbpAccount = await prisma.google_gbp_account.findFirst({
      where: {
        company_id: companyId,
        external_connection_id: ext.id,
        status: "active",
      },
      orderBy: { created_at: "desc" },
    });

    if (!gbpAccount) {
      return NextResponse.json(
        { ok: false, error: "no_gbp_account_for_connection" },
        { status: 404 },
      );
    }

    const googleAccountId = gbpAccount.google_account_id?.trim();
    if (!googleAccountId) {
      return NextResponse.json(
        { ok: false, error: "invalid_gbp_account_id" },
        { status: 500 },
      );
    }

    // 3) Resolver access_token válido (igual enfoque que en locations)
    const redirectUri =
      process.env.GOOGLE_BUSINESS_REDIRECT_URI ||
      `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/business-profile/callback`;

    const client = new google.auth.OAuth2(
      process.env.GOOGLE_BUSINESS_CLIENT_ID!,
      process.env.GOOGLE_BUSINESS_CLIENT_SECRET!,
      redirectUri,
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
          { status: 401 },
        );
      }
    }

    if (!accessToken) {
      return NextResponse.json(
        { ok: false, error: "no_valid_access_token" },
        { status: 401 },
      );
    }

    // 4) Leer todas las locations de esta company/account
    const gbpLocations = await prisma.google_gbp_location.findMany({
      where: {
        company_id: companyId,
        account_id: gbpAccount.id,
      },
    });

    if (!gbpLocations.length) {
      console.warn(
        "[GBP][reviews] No google_gbp_location rows for company/account",
        { companyId, accountId: gbpAccount.id },
      );
      return NextResponse.json(
        { ok: true, totalLocations: 0, totalReviews: 0 },
        { status: 200 },
      );
    }

    let totalReviews = 0;

    // 5) Para cada location, llamar a /reviews y upsert
    for (const loc of gbpLocations) {
      // name o id para construir el path
      let locResource =
        (loc.google_location_name ?? "") ||
        (loc.google_location_id ?? "");

      if (!locResource) {
        console.warn(
          "[GBP][reviews] location sin resource name",
          loc.id,
        );
        continue;
      }

      // Normalizar: queremos "locations/XXXX"
      if (!locResource.startsWith("locations/")) {
        // Caso en que guardaste solo el número "2386..."
        locResource = `locations/${locResource}`;
      }

      const url = `https://mybusiness.googleapis.com/v4/accounts/${encodeURIComponent(
        googleAccountId,
      )}/${locResource}/reviews`;

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
          text,
          "\nURL:",
          url,
        );
        continue;
      }

      const json = (await resp.json()) as any;

      const reviews: any[] = Array.isArray(json.reviews)
        ? json.reviews
        : [];

      const averageRating =
        typeof json.averageRating === "number"
          ? json.averageRating
          : null;
      const totalReviewCount =
        typeof json.totalReviewCount === "number"
          ? json.totalReviewCount
          : null;

      console.log(
        `[GBP][reviews] Location ${loc.id} -> ${reviews.length} reviews`,
      );

      // Upsert por cada review
      for (const rev of reviews) {
        const resourceName: string = String(rev.name ?? "").trim();
        if (!resourceName) continue;

        // nombre tipo "accounts/.../locations/.../reviews/XXXXX"
        const googleReviewId =
          resourceName.split("/").pop() ?? resourceName;

        const starRating: string = String(rev.starRating ?? "STAR_RATING_UNSPECIFIED");
        const comment: string | null =
          typeof rev.comment === "string" ? rev.comment : null;

        const createTimeStr = rev.createTime ?? rev.reviewReply?.createTime;
        const updateTimeStr = rev.updateTime ?? rev.reviewReply?.updateTime;

        const createTime = createTimeStr
          ? new Date(createTimeStr)
          : new Date();
        const updateTime = updateTimeStr
          ? new Date(updateTimeStr)
          : createTime;

        await prisma.google_gbp_reviews.upsert({
          where: {
            company_id_google_review_id: {
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
            reviewer_display_name:
              rev.reviewer?.displayName ?? null,
            reviewer_profile_photo_url:
              rev.reviewer?.profilePhotoUrl ?? null,
            star_rating: starRating,
            comment,
            create_time: createTime,
            update_time: updateTime,
            average_rating:
              averageRating !== null ? averageRating : undefined,
            total_review_count:
              totalReviewCount !== null ? totalReviewCount : undefined,
          },
          update: {
            location_id: null,
            gbp_location_id: loc.id,
            resource_name: resourceName,
            reviewer_display_name:
              rev.reviewer?.displayName ?? null,
            reviewer_profile_photo_url:
              rev.reviewer?.profilePhotoUrl ?? null,
            star_rating: starRating,
            comment,
            create_time: createTime,
            update_time: updateTime,
            average_rating:
              averageRating !== null ? averageRating : undefined,
            total_review_count:
              totalReviewCount !== null ? totalReviewCount : undefined,
          },
        });

        totalReviews += 1;
      }
    }

    return NextResponse.json(
      {
        ok: true,
        totalLocations: gbpLocations.length,
        totalReviews,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[GBP][reviews] unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: "unexpected_error" },
      { status: 500 },
    );
  }
}
