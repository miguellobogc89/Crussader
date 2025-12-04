// app/api/reviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const locationId = url.searchParams.get("locationId");
    const page = Math.max(
      1,
      parseInt(url.searchParams.get("page") ?? "1", 10) || 1
    );
    const size = Math.min(
      50,
      Math.max(1, parseInt(url.searchParams.get("size") ?? "9", 10) || 9)
    ); // grid 3x3 por defecto

    if (!locationId) {
      return NextResponse.json(
        { ok: false, error: "missing_locationId" },
        { status: 400 }
      );
    }

    const total = await prisma.review.count({ where: { locationId } });
    const totalPages = Math.max(1, Math.ceil(total / size));
    const clampedPage = Math.min(page, totalPages);
    const skip = (clampedPage - 1) * size;

    const reviews = await prisma.review.findMany({
      where: { locationId },
      orderBy: [{ createdAtG: "desc" }, { ingestedAt: "desc" }],
      skip,
      take: size,
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
        date: r.createdAtG
          ? new Date(r.createdAtG).toISOString()
          : "",
        avatar: r.reviewerPhoto ?? undefined,

        // 👇 ya traemos la última respuesta “lista para la UI”
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
      page: clampedPage,
      size,
      total,
      totalPages,
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
