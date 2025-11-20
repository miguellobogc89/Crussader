// app/api/mybusiness/locations/[id]/sync-reviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/db";
import { ReviewProvider } from "@prisma/client";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  context: { params: { locationId: string } },
) {
  const locationId = context.params.locationId;

  if (!locationId) {
    return NextResponse.json(
      { ok: false, error: "locationId_requerido_en_ruta" },
      { status: 400 },
    );
  }

  try {
    // 1) Cargar Location
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

    // 2) Buscar la google_gbp_location vinculada a esta Location
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

    // 3) Traer todas las reviews crudas de esa google_gbp_location
    const gbpReviews = await prisma.google_gbp_reviews.findMany({
      where: {
        company_id: companyId,
        gbp_location_id: gbpLoc.id,
      },
    });

    if (gbpReviews.length === 0) {
      return NextResponse.json({
        ok: true,
        synced: {
          totalFromGbp: 0,
          upserted: 0,
        },
        warning: "No hay reviews en google_gbp_reviews para esta ubicación",
      });
    }

    // 4) (Opcional pero útil) Marcar también la location_id en la tabla de GBP
    await prisma.google_gbp_reviews.updateMany({
      where: {
        company_id: companyId,
        gbp_location_id: gbpLoc.id,
      },
      data: {
        location_id: locationId,
      },
    });

    const ratingMap: Record<string, number> = {
      ONE: 1,
      TWO: 2,
      THREE: 3,
      FOUR: 4,
      FIVE: 5,
    };

    let upserted = 0;

    // 5) Copiar a Review (upsert por provider + externalId)
    for (const r of gbpReviews) {
      const rating =
        r.star_rating && ratingMap[r.star_rating]
          ? ratingMap[r.star_rating]
          : null;

      // Si no tenemos rating interpretable, la ignoramos
      if (rating === null) {
        console.warn(
          "[sync-reviews] review sin rating válido, se omite",
          r.google_review_id,
          r.star_rating,
        );
        continue;
      }

      await prisma.review.upsert({
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
          comment: r.comment ?? null,
          languageCode: null, // en google_gbp_reviews no tenemos language_code
          createdAtG: r.create_time,
          updatedAtG: r.update_time,
        },
        update: {
          companyId,
          locationId,
          reviewerName: r.reviewer_display_name ?? null,
          reviewerPhoto: r.reviewer_profile_photo_url ?? null,
          rating,
          comment: r.comment ?? null,
          updatedAtG: r.update_time,
        },
      });

      upserted += 1;
    }

    return NextResponse.json({
      ok: true,
      synced: {
        totalFromGbp: gbpReviews.length,
        upserted,
      },
    });
  } catch (err: any) {
    console.error("[mybusiness][sync-reviews] error", err);
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
