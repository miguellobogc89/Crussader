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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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
      { createdAt: "desc" },
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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

  // 🔹 Campos extra que vienen del cliente para regenerar
  const mode: string | undefined =
    typeof body?.mode === "string" ? body.mode : undefined;
  const previousContent: string | undefined =
    typeof body?.previousContent === "string"
      ? body.previousContent
      : undefined;
  const previousResponseId: string | undefined =
    typeof body?.previousResponseId === "string"
      ? body.previousResponseId
      : undefined;

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
      return NextResponse.json(
        { ok: true, response: created },
        { status: 201 }
      );
    }

    // 2) Generar IA (primera vez o regenerar)
    if (action === "generate" || !content) {
      const created = await createAIResponseForReview({
        reviewId: id,
        // estos campos son opcionales y solo se usarán
        // cuando realmente estemos regenerando
        mode,               // p.ej. "regenerate"
        previousContent,    // texto anterior completo
        previousResponseId, // id de la respuesta previa
      } as any); // si TS se queja por exceso de propiedades, lo dejamos así de momento

      return NextResponse.json(
        { ok: true, response: created },
        { status: 201 }
      );
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
      return NextResponse.json(
        { ok: true, response: created },
        { status: 201 }
      );
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
