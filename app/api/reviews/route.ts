// app/api/reviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const locationId = url.searchParams.get("locationId");
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
    const size = Math.min(
      50,
      Math.max(1, parseInt(url.searchParams.get("size") ?? "9", 10) || 9)
    ); // tu grid 3x3

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
      select: {
        id: true,
        rating: true,
        reviewerName: true,
        reviewerPhoto: true,   // 👈 AÑADIDO
        comment: true,
        createdAtG: true,
      },
    });

    const rows = reviews.map((r) => ({
      id: r.id,
      author: r.reviewerName ?? "Anónimo",
      content: r.comment ?? "",
      rating: r.rating ?? 0,
      date: r.createdAtG ? new Date(r.createdAtG).toISOString() : "",
      avatar: r.reviewerPhoto ?? undefined, // 👈 AÑADIDO: encaja con ReviewCard.avatar
    }));

    return NextResponse.json({
      ok: true,
      page: clampedPage,
      size,
      total,
      totalPages,
      reviews: rows,
    });
  } catch (e) {
    console.error("[GET /api/reviews]", e);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}
