// app/api/mybusiness/locations/[id]/refresh-reviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/db";
import { ReviewProvider } from "@prisma/client";
import {
  getExternalConnectionForCompany,
  getValidAccessToken,
  listGbpReviewsForLocation,
} from "@/lib/integrations/google-business/client";
import { createAIResponseForReview } from "@/lib/ai/reviews/createAIResponseForReview.adapter";

// 👇 NUEVO: usamos tu librería centralizada
import { generateNotification } from "@/lib/notifications/generateNotification";

export const runtime = "nodejs";

type RouteParams = {
  params: Promise<{ id: string }>;
};

const ratingMap: Record<string, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};

function mapStarRatingToInt(star: string | null | undefined): number | null {
  if (!star) return null;
  const v = star.toString().trim().toUpperCase();
  if (ratingMap[v] !== undefined) return ratingMap[v];
  const num = Number(v);
  if (!Number.isNaN(num) && num >= 1 && num <= 5) return num;
  return null;
}

function stripGoogleTranslated(text: string | null | undefined): string | null {
  if (!text) return null;
  const trimmed = text.trim();
  if (!trimmed) return null;
  const marker = "(Translated by Google)";
  const idx = trimmed.indexOf(marker);
  if (idx >= 0) {
    return trimmed.slice(0, idx).trimEnd();
  }
  return trimmed;
}

function buildLocationResourceName(
  googleLocationId: string,
  accountId: string,
): string {
  const trimmed = googleLocationId.trim();
  if (!trimmed) {
    throw new Error("[GBP][refresh-reviews] empty google_location_id");
  }

  if (trimmed.startsWith("accounts/")) {
    return trimmed;
  }

  if (trimmed.startsWith("locations/")) {
    return `accounts/${accountId}/${trimmed}`;
  }

  return `accounts/${accountId}/locations/${trimmed}`;
}

export async function POST(
  _req: NextRequest,
  { params }: RouteParams,
) {
  const { id: locationId } = await params;

  if (!locationId) {
    return NextResponse.json(
      { ok: false, error: "locationId_requerido_en_ruta" },
      { status: 400 },
    );
  }

  try {
    // 1) Location local
    const loc = await prisma.location.findUnique({
      where: { id: locationId },
    });

    if (!loc) {
      return NextResponse.json(
        { ok: false, error: "location_no_encontrada" },
        { status: 404 },
      );
    }

    const companyId = loc.companyId;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { account_id: true },
    });

    // 2) google_gbp_location linkada a esta Location
    const gbpLoc = await prisma.google_gbp_location.findFirst({
      where: {
        company_id: companyId,
        location_id: locationId,
      },
    });

    if (!gbpLoc) {
      return NextResponse.json(
        {
          ok: false,
          error: "no_gbp_location_linked",
          message:
            "No hay ninguna google_gbp_location vinculada a esta Location",
        },
        { status: 404 },
      );
    }

    if (!gbpLoc.google_location_id) {
      return NextResponse.json(
        {
          ok: false,
          error: "gbp_location_without_google_location_id",
        },
        { status: 400 },
      );
    }

    // 3) ExternalConnection + access token
    const ext = await getExternalConnectionForCompany(companyId);
    const accessToken = await getValidAccessToken(ext);

    // 4) Cuenta GBP (google_account_id)
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
    const locationResourceName = buildLocationResourceName(
      gbpLoc.google_location_id,
      accountId,
    );

    let totalFromGoogle = 0;
    let upsertedGbpReviews = 0;
    let repliesUpdated = 0;

    // 5) Llamar a Google para ESTA location y upsert en google_gbp_reviews
    await prisma.$transaction(async (tx) => {
      let pageToken: string | undefined = undefined;
      const now = new Date();

      do {
        const { reviews, nextPageToken } = await listGbpReviewsForLocation({
          locationResourceName,
          accessToken,
          pageToken,
        });

        for (const rev of reviews) {
          totalFromGoogle += 1;

          const resourceName: string =
            typeof rev.name === "string" ? rev.name : "";
          if (!resourceName) continue;

          const googleReviewId: string =
            typeof rev.reviewId === "string" && rev.reviewId.trim().length > 0
              ? rev.reviewId.trim()
              : resourceName;

          let starRatingStr: string | null = null;
          if (typeof rev.starRating === "string") {
            starRatingStr = rev.starRating;
          } else if (typeof rev.starRating === "number") {
            starRatingStr = String(rev.starRating);
          }

          const commentRaw =
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

          const createTime =
            createTimeStr && !Number.isNaN(Date.parse(createTimeStr))
              ? new Date(createTimeStr)
              : now;

          const updateTime =
            updateTimeStr && !Number.isNaN(Date.parse(updateTimeStr))
              ? new Date(updateTimeStr)
              : now;

          // Datos de la respuesta (reviewReply)
          let replyComment: string | null = null;
          let replyUpdateTime: Date | null = null;

          if (rev.reviewReply) {
            if (
              typeof rev.reviewReply.comment === "string" &&
              rev.reviewReply.comment.trim().length > 0
            ) {
              replyComment = rev.reviewReply.comment.trim();
            }

            const replyUpdateStr: string | null =
              typeof rev.reviewReply.updateTime === "string"
                ? rev.reviewReply.updateTime
                : null;

            if (
              replyUpdateStr &&
              !Number.isNaN(Date.parse(replyUpdateStr))
            ) {
              replyUpdateTime = new Date(replyUpdateStr);
            }
          }

          const record = await tx.google_gbp_reviews.upsert({
            where: {
              company_id_google_review_id: {
                company_id: companyId,
                google_review_id: googleReviewId,
              },
            },
            create: {
              company_id: companyId,
              location_id: null, // lo rellenamos luego
              gbp_location_id: gbpLoc.id,
              google_review_id: googleReviewId,
              resource_name: resourceName,
              reviewer_display_name: reviewerDisplayName ?? undefined,
              reviewer_profile_photo_url:
                reviewerProfilePhotoUrl ?? undefined,
              star_rating: starRatingStr ?? "STAR_RATING_UNSPECIFIED",
              comment: commentRaw ?? undefined,
              create_time: createTime,
              update_time: updateTime,
              average_rating: null,
              total_review_count: null,
              reply_comment: replyComment ?? undefined,
              reply_update_time: replyUpdateTime ?? undefined,
              created_at: now,
              updated_at: now,
            },
            update: {
              location_id: null,
              gbp_location_id: gbpLoc.id,
              resource_name: resourceName,
              reviewer_display_name: reviewerDisplayName ?? undefined,
              reviewer_profile_photo_url:
                reviewerProfilePhotoUrl ?? undefined,
              star_rating: starRatingStr ?? "STAR_RATING_UNSPECIFIED",
              comment: commentRaw ?? undefined,
              create_time: createTime,
              update_time: updateTime,
              reply_comment: replyComment ?? undefined,
              reply_update_time: replyUpdateTime ?? undefined,
              updated_at: now,
            },
          });

          if (record) {
            upsertedGbpReviews += 1;
            if (replyComment || replyUpdateTime) {
              repliesUpdated += 1;
            }
          }
        }

        pageToken = nextPageToken;
      } while (pageToken);
    });

    // 6) Leer todas las reviews de esa gbp_location ya guardadas
    const gbpReviews = await prisma.google_gbp_reviews.findMany({
      where: {
        company_id: companyId,
        gbp_location_id: gbpLoc.id,
      },
      orderBy: { create_time: "asc" },
    });

    if (gbpReviews.length === 0) {
      return NextResponse.json({
        ok: true,
        synced: {
          totalFromGoogle,
          totalFromGbpTable: 0,
          reviewsUpserted: 0,
          responsesSynced: 0,
        },
        warning: "No hay reviews en google_gbp_reviews para esta ubicación",
      });
    }

    // 7) Marcar la location_id en la tabla GBP
    await prisma.google_gbp_reviews.updateMany({
      where: {
        company_id: companyId,
        gbp_location_id: gbpLoc.id,
      },
      data: {
        location_id: locationId,
      },
    });

    let reviewsUpserted = 0;

    // 8) Upsert a Review (local) + Notification en reviews nuevas
    for (const r of gbpReviews) {
      const rating = mapStarRatingToInt(r.star_rating);

      if (rating === null) {
        console.warn(
          "[refresh-reviews] review sin rating válido, se omite",
          r.google_review_id,
          r.star_rating,
        );
        continue;
      }

      const cleanComment = stripGoogleTranslated(
        typeof r.comment === "string" ? r.comment : null,
      );

      // ¿Ya existía esta review en nuestra tabla local?
      const existingLocal = await prisma.review.findUnique({
        where: {
          provider_externalId: {
            provider: ReviewProvider.GOOGLE,
            externalId: r.google_review_id,
          },
        },
        select: { id: true },
      });

      const isNew = !existingLocal;

      const review = await prisma.review.upsert({
        where: {
          provider_externalId: {
            provider: ReviewProvider.GOOGLE,
            externalId: r.google_review_id,
          },
        },
        create: {
          companyId,
          locationId,
          provider: ReviewProvider.GOOGLE,
          externalId: r.google_review_id,
          reviewerName: r.reviewer_display_name ?? null,
          reviewerPhoto: r.reviewer_profile_photo_url ?? null,
          reviewerAnon: false,
          rating,
          comment: cleanComment,
          languageCode: null,
          createdAtG: r.create_time,
          updatedAtG: r.update_time,
        },
        update: {
          companyId,
          locationId,
          reviewerName: r.reviewer_display_name ?? null,
          reviewerPhoto: r.reviewer_profile_photo_url ?? null,
          rating,
          comment: cleanComment,
          updatedAtG: r.update_time,
        },
      });

      reviewsUpserted += 1;

      // ⬇️ NUEVO: si es nueva en nuestra BD → delegamos en generateNotification
      if (isNew) {
        await generateNotification({
          model: "Review",
          action: "create",
          data: {
            id: review.id,
            companyId,
            locationId,
            provider: review.provider,
            externalId: review.externalId,
            reviewerName: review.reviewerName ?? undefined,
            rating: review.rating,
            comment: review.comment ?? undefined,
            createdAtG: review.createdAtG ?? undefined,
          },
        });
      }

      // NUEVO: asegurar borrador IA para cualquier review local sin respuesta
      const hasGoogleReply =
        typeof r.reply_comment === "string" &&
        r.reply_comment.trim().length > 0;

      if (!hasGoogleReply) {
        const existingLocalResponse = await prisma.response.findFirst({
          where: { reviewId: review.id },
          select: { id: true },
        });

        if (!existingLocalResponse) {
          await createAIResponseForReview({ reviewId: review.id });
        }
      }
    }

    // 9) Responses locales desde reply_comment
    const gbpReplies = gbpReviews.filter(
      (r) => r.reply_comment && r.reply_comment.trim().length > 0,
    );

    let responsesSynced = 0;

    if (gbpReplies.length > 0) {
      const externalIdsWithReplies = gbpReplies.map(
        (r) => r.google_review_id,
      );

      const localReviews = await prisma.review.findMany({
        where: {
          companyId,
          locationId,
          provider: ReviewProvider.GOOGLE,
          externalId: { in: externalIdsWithReplies },
        },
        select: {
          id: true,
          externalId: true,
        },
      });

      const reviewIdByExternalId = new Map<string, string>();
      for (const rev of localReviews) {
        reviewIdByExternalId.set(rev.externalId, rev.id);
      }

      for (const r of gbpReplies) {
        const reviewId = reviewIdByExternalId.get(r.google_review_id);
        if (!reviewId) continue;

        let replyContent = stripGoogleTranslated(r.reply_comment);
        if (!replyContent) continue;

        let publishedAt: Date | null = null;

        if (r.reply_update_time instanceof Date) {
          publishedAt = r.reply_update_time;
        } else if (
          r.reply_update_time &&
          !Number.isNaN(Date.parse(String(r.reply_update_time)))
        ) {
          publishedAt = new Date(String(r.reply_update_time));
        } else {
          publishedAt = new Date();
        }

        const existing = await prisma.response.findFirst({
          where: { reviewId },
          orderBy: { createdAt: "desc" },
        });

        if (existing) {
          await prisma.response.update({
            where: { id: existing.id },
            data: {
              content: replyContent,
              published: true,
              publishedAt,
            },
          });
        } else {
          await prisma.response.create({
            data: {
              reviewId,
              content: replyContent,
              published: true,
              publishedAt,
            },
          });
        }

        responsesSynced += 1;
      }
    }

    return NextResponse.json({
      ok: true,
      synced: {
        totalFromGoogle,
        totalFromGbpTable: gbpReviews.length,
        reviewsUpserted,
        responsesSynced,
        repliesUpdatedInGbpTable: repliesUpdated,
      },
    });
  } catch (err: any) {
    console.error("[mybusiness][refresh-reviews] error", err);
    return NextResponse.json(
      {
        ok: false,
        error: "internal_error",
        details: err?.message ?? String(err),
      },
      { status: 500 },
    );
  }
}
