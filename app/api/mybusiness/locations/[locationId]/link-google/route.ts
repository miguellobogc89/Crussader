// app/api/mybusiness/locations/[locationId]/link-google/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/db";

export const runtime = "nodejs";

type Body = {
  gbpLocationId?: string; // id de google_gbp_location (UUID)
};

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

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ locationId: string }> },
) {
  const { locationId } = await context.params;

  if (!locationId) {
    return NextResponse.json(
      { error: "locationId requerido en la ruta" },
      { status: 400 },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json(
      { error: "Body JSON inválido" },
      { status: 400 },
    );
  }

  const gbpLocationId = body.gbpLocationId;
  if (!gbpLocationId) {
    return NextResponse.json(
      { error: "gbpLocationId es obligatorio en el body" },
      { status: 400 },
    );
  }

  try {
    // 1) Cargamos Location y la ubicación de Google
    const [loc, gbpLoc] = await Promise.all([
      prisma.location.findUnique({
        where: { id: locationId },
      }),
      prisma.google_gbp_location.findUnique({
        where: { id: gbpLocationId },
      }),
    ]);

    if (!loc) {
      return NextResponse.json(
        { error: "Location no encontrada" },
        { status: 404 },
      );
    }

    if (!gbpLoc) {
      return NextResponse.json(
        { error: "google_gbp_location no encontrada" },
        { status: 404 },
      );
    }

    // 2) Validar que pertenecen a la misma empresa
    if (loc.companyId !== gbpLoc.company_id) {
      return NextResponse.json(
        {
          error:
            "La ubicación de Google y la Location no pertenecen a la misma empresa",
        },
        { status: 403 },
      );
    }

    // 3) Cargar la cuenta de Google (para googleAccountId)
    const account = await prisma.google_gbp_account.findUnique({
      where: { id: gbpLoc.account_id },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Cuenta de Google Business no encontrada para esta ubicación" },
        { status: 400 },
      );
    }

    // 4) Transacción: enlazar ambas tablas
    const result = await prisma.$transaction(async (tx) => {
      const updatedLocation = await tx.location.update({
        where: { id: locationId },
        data: {
          googleLocationId: gbpLoc.google_location_id,
          googlePlaceId: gbpLoc.google_place_id ?? gbpLoc.place_id ?? null,
          googleAccountId: account.google_account_id,
          externalConnectionId: gbpLoc.external_connection_id,
        },
      });

      const updatedGbpLocation = await tx.google_gbp_location.update({
        where: { id: gbpLocationId },
        data: {
          location_id: locationId,
          status: "linked",
        },
      });

      return { updatedLocation, updatedGbpLocation };
    });

    // 5) Cargar reviews de ESTA ubicación GBP desde google_gbp_reviews
    const gbpReviews = await prisma.google_gbp_reviews.findMany({
      where: {
        company_id: loc.companyId,
        gbp_location_id: gbpLoc.id,
      },
      orderBy: { create_time: "asc" },
    });

    console.log(
      "[mybusiness][link-google] reviews GBP encontradas para esta ubicación:",
      gbpReviews.length,
    );

    if (gbpReviews.length > 0) {
      const reviewRows = gbpReviews
        .map((r) => {
          const ratingInt = mapStarRatingToInt(r.star_rating);
          if (ratingInt <= 0) {
            // Si no podemos mapear el rating, saltamos la fila
            return null;
          }

          return {
            companyId: loc.companyId,
            locationId: loc.id,
            provider: "GOOGLE" as const,
            externalId: r.google_review_id,
            reviewerName: r.reviewer_display_name ?? null,
            reviewerPhoto: r.reviewer_profile_photo_url ?? null,
            reviewerAnon: r.reviewer_display_name ? false : true,
            rating: ratingInt,
            comment: r.comment ?? null,
            languageCode: null,
            createdAtG: r.create_time,
            updatedAtG: r.update_time,
          };
        })
        .filter(Boolean) as Array<{
        companyId: string;
        locationId: string;
        provider: "GOOGLE";
        externalId: string;
        reviewerName: string | null;
        reviewerPhoto: string | null;
        reviewerAnon: boolean;
        rating: number;
        comment: string | null;
        languageCode: string | null;
        createdAtG: Date | null;
        updatedAtG: Date | null;
      }>;

      if (reviewRows.length > 0) {
        const insertResult = await prisma.review.createMany({
          data: reviewRows,
          skipDuplicates: true, // respeta @@unique([provider, externalId])
        });

        console.log(
          "[mybusiness][link-google] reviews creadas en Review:",
          insertResult.count,
        );
      } else {
        console.log(
          "[mybusiness][link-google] no hay reviews válidas (rating) para insertar",
        );
      }
    } else {
      console.log(
        "[mybusiness][link-google] no hay reviews en google_gbp_reviews para esta ubicación",
      );
    }

    return NextResponse.json(
      {
        ok: true,
        linked: {
          locationId: result.updatedLocation.id,
          gbpLocationId: result.updatedGbpLocation.id,
        },
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("[mybusiness][link-google] error", err);
    return NextResponse.json(
      {
        error: "Error interno al vincular ubicación",
        details: err?.message ?? String(err),
      },
      { status: 500 },
    );
  }
}
