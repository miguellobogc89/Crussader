// app/api/reviews/tasks/topics/list/route.ts
// ===================================================
// GET para ver los topics creados (y sus concepts) desde el navegador.
//   /api/reviews/tasks/topics/list
//
// Devuelve: { ok, topics: [{ id, label, description, concept_count, avg_rating, is_stable, concepts:[{id,label}]}] }
// ⓿ Nota: Se ha eliminado avg_rating de cada concept porque ya no existe en el modelo.
// ===================================================

import { NextResponse } from "next/server";
import { prisma } from "@/app/server/db";

export async function GET() {
  try {
    const topics = await prisma.topic.findMany({
      orderBy: [{ updated_at: "desc" }],
      select: {
        id: true,
        label: true,
        description: true,
        concept_count: true,
        avg_rating: true,   // <- sigue existiendo en topic
        is_stable: true,
        created_at: true,
        updated_at: true,
        concept: {
          orderBy: { updated_at: "desc" },
          select: {
            id: true,
            label: true,
            // avg_rating: false // <- eliminado: ya no existe en concept
          },
        },
      },
    });

    return NextResponse.json({ ok: true, topics });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "topics list failed" },
      { status: 500 }
    );
  }
}
