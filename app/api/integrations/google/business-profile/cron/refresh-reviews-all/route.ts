// app/api/integrations/google/business-profile/cron/refresh-reviews-all/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const companyId = (body?.companyId as string | undefined)?.trim();

    // 1) Locations con GBP linkado (y opcionalmente filtradas por companyId)
    const locations = await prisma.location.findMany({
      where: {
        ...(companyId ? { companyId } : {}),
        google_gbp_location: {
          some: {
            is_active: true,
          },
        },
      },
      select: {
        id: true,
        companyId: true,
      },
    });

    if (locations.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "No hay locations con GBP activas para refrescar",
        totalLocations: 0,
      });
    }

    // 2) Base URL para llamar al endpoint existente de refresh por location
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      req.nextUrl.origin ||
      "http://localhost:3000";

    let successCount = 0;
    let errorCount = 0;
    const results: Array<{
      locationId: string;
      status: "ok" | "error";
      statusCode?: number;
      error?: string;
      synced?: unknown;
    }> = [];

    // 3) Recorrer locations y llamar a tu endpoint actual de refresh
    for (const loc of locations) {
      const url = `${baseUrl}/api/mybusiness/locations/${loc.id}/refresh-reviews`;

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          // Puedes usar este body para diferenciar en logs que viene de cron
          body: JSON.stringify({ reason: "cron_refresh_all" }),
        });

        if (!res.ok) {
          errorCount += 1;
          results.push({
            locationId: loc.id,
            status: "error",
            statusCode: res.status,
          });
          continue;
        }

        const data = await res.json().catch(() => null);
        successCount += 1;
        results.push({
          locationId: loc.id,
          status: "ok",
          synced: data?.synced ?? null,
        });
      } catch (err: any) {
        errorCount += 1;
        results.push({
          locationId: loc.id,
          status: "error",
          error: err?.message ?? String(err),
        });
      }
    }

    // 4) 🔍 Limpieza extra: desincronizaciones donde Google ya no tiene reply
    try {
      // Limitamos a las companies efectivamente procesadas
      const companiesToCheck: string[] = companyId
        ? [companyId]
        : Array.from(new Set(locations.map((l) => l.companyId)));

      for (const cId of companiesToCheck) {
        // a) GBP reviews sin reply (estado real en Google, tras el refresh por location)
        const gbpReviewsWithoutReply = await prisma.google_gbp_reviews.findMany({
          where: {
            company_id: cId,
            reply_comment: null,
          },
          select: {
            company_id: true,
            google_review_id: true,
          },
        });

        if (gbpReviewsWithoutReply.length === 0) {
          continue;
        }

        const externalIds = gbpReviewsWithoutReply.map(
          (r) => r.google_review_id,
        );

        // b) Reviews internas que aún figuran como respondidas para esas GBP reviews
        const reviewsToFix = await prisma.review.findMany({
          where: {
            companyId: cId,
            externalId: { in: externalIds },
            responded: true,
          },
          select: { id: true },
        });

        const reviewIds = reviewsToFix.map((r) => r.id);
        if (reviewIds.length === 0) {
          continue;
        }

        // c) Dejar coherente Review, Response y espejo de respuestas GBP
        await prisma.$transaction([
          // Reviews internas: marcar como no respondidas
          prisma.review.updateMany({
            where: { id: { in: reviewIds } },
            data: {
              responded: false,
              respondedAt: null,
              replyComment: null,
              replyUpdatedAtG: null,
            },
          }),

          // Responses internas: despublicar
          prisma.response.updateMany({
            where: {
              reviewId: { in: reviewIds },
              published: true,
            },
            data: {
              published: false,
              publishedAt: null,
              status: "PENDING",
            },
          }),

          // Espejo de respuestas GBP (por si quedara algo huérfano)
          prisma.google_gbp_responses.deleteMany({
            where: {
              company_id: cId,
              google_review_id: { in: externalIds },
            },
          }),
        ]);
      }
    } catch (cleanupErr: any) {
      console.error(
        "[gbp][cron][refresh-reviews-all] cleanup deleted replies error",
        cleanupErr,
      );
      // No rompemos el cron si falla solo la limpieza
    }

    return NextResponse.json({
      ok: true,
      totalLocations: locations.length,
      successCount,
      errorCount,
      results,
    });
  } catch (err: any) {
    console.error("[gbp][cron][refresh-reviews-all] error", err);
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

// 👇 Añadido para que el cron de Vercel (GET) reutilice la misma lógica
export async function GET(req: NextRequest) {
  return POST(req);
}
