// app/api/mybusiness/locations/[id]/link-google/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/db";

export const runtime = "nodejs";

type Body = {
  // id de google_gbp_location (UUID en tu tabla)
  gbpLocationId?: string;
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
  { params }: { params: Promise<{ id: string }> },
) {
  // 👇 hay que AWAIT
  const { id: locationId } = await params;

  if (!locationId) {
    return NextResponse.json(
      { ok: false, error: "missing_location_id" },
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
        {
          error:
            "Cuenta de Google Business no encontrada para esta ubicación",
        },
        { status: 400 },
      );
    }

    // PlaceId que vamos a intentar guardar
    const newPlaceId = gbpLoc.google_place_id ?? gbpLoc.place_id ?? null;

    // 4) Transacción: enlazar ambas tablas sin romper el unique(googlePlaceId)
    const result = await prisma.$transaction(async (tx) => {
      let safePlaceId: string | undefined = undefined;

      if (newPlaceId) {
        const existing = await tx.location.findUnique({
          where: { googlePlaceId: newPlaceId },
          select: { id: true },
        });

        if (!existing || existing.id === locationId) {
          safePlaceId = newPlaceId;
        } else {
          console.warn(
            "[mybusiness][link-google] googlePlaceId ya en uso, se omite en update",
            {
              newPlaceId,
              existingLocationId: existing.id,
              currentLocationId: locationId,
            },
          );
        }
      }

      const updatedLocation = await tx.location.update({
        where: { id: locationId },
        data: {
          googleLocationId: gbpLoc.google_location_id,
          // solo tocamos googlePlaceId si es seguro
          googlePlaceId: safePlaceId ?? undefined,
          googleAccountId: account.google_account_id,
          externalConnectionId: gbpLoc.external_connection_id ?? null,
        },
      });

      const updatedGbpLocation = await tx.google_gbp_location.update({
        where: { id: gbpLocationId },
        data: {
          location_id: locationId,
          status: "linked",
          is_active: true,
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
      // 5.a) Copiamos reviews a la tabla Review (local)
      const reviewRows = gbpReviews
        .map((r) => {
          const ratingInt = mapStarRatingToInt(r.star_rating);
          if (ratingInt <= 0) {
            console.warn(
              "[mybusiness][link-google] review sin rating válido, se omite",
              r.google_review_id,
              r.star_rating,
            );
            return null;
          }

          // Comentario original tal y como viene de google_gbp_reviews
          let comment: string | null =
            r.comment && r.comment.trim().length > 0
              ? r.comment.trim()
              : null;

          // Si viene con "(Translated by Google)", nos quedamos SOLO con la parte anterior
          if (comment) {
            const marker = "(Translated by Google)";
            const idx = comment.indexOf(marker);
            if (idx >= 0) {
              comment = comment.slice(0, idx).trimEnd();
            }
          }

          console.log(
            "[mybusiness][link-google] mapeando review",
            r.google_review_id,
            "comment_sanitized:",
            comment,
          );

          return {
            companyId: loc.companyId,
            locationId: loc.id,
            provider: "GOOGLE" as const,
            externalId: r.google_review_id,
            reviewerName: r.reviewer_display_name ?? null,
            reviewerPhoto: r.reviewer_profile_photo_url ?? null,
            reviewerAnon: r.reviewer_display_name ? false : true,
            rating: ratingInt,
            comment,
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

      // 5.b) Crear / actualizar Responses locales a partir de reply_comment
      const gbpReplies = gbpReviews.filter(
        (r) => r.reply_comment && r.reply_comment.trim().length > 0,
      );

      if (gbpReplies.length > 0) {
        const externalIdsWithReplies = gbpReplies.map(
          (r) => r.google_review_id,
        );

        // Buscamos las reviews locales correspondientes a esos google_review_id
        const localReviews = await prisma.review.findMany({
          where: {
            companyId: loc.companyId,
            locationId: loc.id,
            provider: "GOOGLE",
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

          let replyContent = r.reply_comment?.trim() ?? "";
          if (!replyContent) continue;

          // Limpieza del "(Translated by Google)" también en la respuesta
          const marker = "(Translated by Google)";
          const idx = replyContent.indexOf(marker);
          if (idx >= 0) {
            replyContent = replyContent.slice(0, idx).trimEnd();
          }

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

          // ¿Ya existe alguna Response para esta review?
          const existing = await prisma.response.findFirst({
            where: { reviewId },
            orderBy: { createdAt: "desc" },
          });

          if (existing) {
            // Actualizamos contenido + marca como publicada
            await prisma.response.update({
              where: { id: existing.id },
              data: {
                content: replyContent,
                published: true,
                publishedAt,
              },
            });
          } else {
            // Creamos Response nueva ligada a la Review
            await prisma.response.create({
              data: {
                reviewId,
                content: replyContent,
                published: true,
                publishedAt,
              },
            });
          }
        }

        console.log(
          "[mybusiness][link-google] responses locales sincronizadas desde reply_comment:",
          gbpReplies.length,
        );
      } else {
        console.log(
          "[mybusiness][link-google] no hay reply_comment en google_gbp_reviews para esta ubicación",
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
