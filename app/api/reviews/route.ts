// app/api/reviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const locationId = url.searchParams.get("locationId");

    if (!locationId) {
      return NextResponse.json(
        { ok: false, error: "missing_locationId" },
        { status: 400 }
      );
    }

    // 👇 TOTAL real de reseñas de esa location
    const total = await prisma.review.count({ where: { locationId } });

    // 👇 SIN PAGINAR: traemos TODAS las reseñas
    const reviews = await prisma.review.findMany({
      where: { locationId },
      orderBy: [{ createdAtG: "desc" }, { ingestedAt: "desc" }],
      include: {
        responses: {
          where: { active: true },
          orderBy: [
            { published: "desc" },
            { status: "asc" },
            { createdAt: "desc" },
          ],
          take: 1, // 👈 solo la versión “principal”
        },
      },
    });

    const rows = reviews.map((r) => {
      const resp = r.responses[0];

      // status UI simplificado para la card
      let uiStatus: "published" | "draft" = "draft";
      if (resp && (resp.published || resp.status === "PUBLISHED")) {
        uiStatus = "published";
      }

      return {
        id: r.id,
        author: r.reviewerName ?? "Anónimo",
        content: r.comment ?? "",
        rating: r.rating ?? 0,
        date: r.createdAtG ? new Date(r.createdAtG).toISOString() : "",
        avatar: r.reviewerPhoto ?? undefined,
        businessResponse: resp
          ? {
              id: resp.id,
              content: resp.content,
              status: uiStatus,
              published: resp.published,
              edited: resp.edited,
              createdAt: resp.createdAt,
            }
          : null,
      };
    });

    return NextResponse.json({
      ok: true,
      // 👇 mantenemos estos campos por compatibilidad, pero ya no hay páginas reales
      page: 1,
      size: total,
      total,
      totalPages: 1,
      reviews: rows,
    });
  } catch (e: any) {
    console.error("[GET /api/reviews]", e);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}
