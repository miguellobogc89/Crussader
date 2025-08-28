import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAIResponseForReview } from "../../../../../lib/ai/createAIResponseForReview";

// GET /api/reviews/:id/responses  → lista respuestas de esa review
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const responses = await prisma.response.findMany({
      where: { reviewId: params.id },
      orderBy: [
        { published: "desc" }, // primero publicadas
        { status: "asc" },     // luego por estado
        { createdAt: "desc" }, // más recientes
      ],
    });
    return NextResponse.json({ ok: true, responses });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Error" },
      { status: 500 }
    );
  }
}

// POST /api/reviews/:id/responses  → genera 1 respuesta IA y la guarda
// (delegando en la función centralizada para evitar duplicación)
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      language?: string;
      tone?: string;
      model?: string;
      promptVersion?: string;
      temperature?: number;
    };

    const created = await createAIResponseForReview(params.id, {
      language: body?.language,         // default dentro de la función
      tone: body?.tone,                 // default dentro de la función
      model: body?.model,
      promptVersion: body?.promptVersion,
      temperature: body?.temperature,
    });

    return NextResponse.json({ ok: true, response: created });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Error" },
      { status: 500 }
    );
  }
}
