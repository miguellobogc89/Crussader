import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // Nota: si el dataset es grande, añade paginación (cursor/take).
  const concepts = await prisma.concept.findMany({
    orderBy: { created_at: "desc" },
    include: {
      topic: { select: { id: true, label: true, description: true } },
      review: {
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAtG: true,
          locationId: true,
          companyId: true,
          Location: { select: { id: true, title: true } },
          Company: { select: { id: true, name: true } },
        },
      },
    },
  });

  // Aplanamos lo justo para la tabla
  const rows = concepts.map((c) => ({
    conceptId: c.id,
    conceptLabel: c.label,
    sentiment: c.sentiment ?? null,
    relevance: c.relevance ?? null,
    conceptRating: c.rating ?? null,
    reviewId: c.review?.id ?? null,
    reviewRating: c.review?.rating ?? null,
    reviewCreatedAt: c.review?.createdAtG ?? null,
    reviewComment: c.review?.comment ?? null,
    locationId: c.review?.locationId ?? null,
    locationTitle: c.review?.Location?.title ?? null,
    companyId: c.review?.companyId ?? null,
    companyName: c.review?.Company?.name ?? null,
    topicId: c.topic?.id ?? null,
    topicLabel: c.topic?.label ?? null,
  }));

  return NextResponse.json({ rows });
}
