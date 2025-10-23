// app/api/reviews/[id]/responses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAIResponseForReview } from "@/lib/ai/reviews/createAIResponseForReview.adapter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** ---------------- GET ----------------
 * Listar todas las respuestas de una review
 */
export async function GET(
  _req: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  if (!id) {
    return NextResponse.json(
      { ok: false, error: "id requerido" },
      { status: 400 }
    );
  }

  const responses = await prisma.response.findMany({
    where: { reviewId: id },
    orderBy: [
      { published: "desc" },
      { status: "asc" },
      { createdAt: "desc" }
    ],
  });

  return NextResponse.json({ ok: true, responses });
}

/** ---------------- POST ----------------
 * Crear una respuesta:
 * - Si viene content + source:HUMAN → se guarda tal cual.
 * - Si action=generate (o no hay content) → se genera por IA.
 * - Si viene content + source:AI → se guarda como IA.
 */
export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  if (!id) {
    return NextResponse.json(
      { ok: false, error: "id requerido" },
      { status: 400 }
    );
  }

  // Parse tolerante (acepta body vacío)
  let body: any = {};
  try {
    const text = await req.text();
    body = text ? JSON.parse(text) : {};
  } catch {
    return NextResponse.json(
      { ok: false, error: "Body JSON inválido" },
      { status: 400 }
    );
  }

  const content: string | undefined =
    typeof body?.content === "string" ? body.content.trim() : undefined;
  const source: "AI" | "HUMAN" = body?.source === "HUMAN" ? "HUMAN" : "AI";
  const action: string = body?.action ?? "generate";

  try {
    // 1) Guardar manual (HUMAN)
    if (content && source === "HUMAN") {
      const created = await prisma.response.create({
        data: {
          reviewId: id,
          content,
          source: "HUMAN",
          status: "PENDING",
        },
      });
      return NextResponse.json({ ok: true, response: created }, { status: 201 });
    }

    // 2) Generar IA
    if (action === "generate" || !content) {
      const created = await createAIResponseForReview({ reviewId: id });

      return NextResponse.json({ ok: true, response: created }, { status: 201 });
    }

    // 3) Guardar content con source AI
    if (content) {
      const created = await prisma.response.create({
        data: {
          reviewId: id,
          content,
          source: "AI",
          status: "PENDING",
        },
      });
      return NextResponse.json({ ok: true, response: created }, { status: 201 });
    }

    return NextResponse.json(
      { ok: false, error: "Sin contenido ni generación" },
      { status: 400 }
    );
  } catch (err: any) {
    const code = err?.message === "review_not_found" ? 404 : 500;
    return NextResponse.json(
      { ok: false, error: String(err?.message ?? err) },
      { status: code }
    );
  }
}
