import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/responses/:id
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ ok: false, error: "id requerido" }, { status: 400 });

  const resp = await prisma.response.findUnique({ where: { id } });
  if (!resp) return NextResponse.json({ ok: false, error: "no encontrada" }, { status: 404 });

  return NextResponse.json({ ok: true, response: resp });
}

// PUT /api/responses/:id → actualiza contenido
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ ok: false, error: "Parámetro 'id' inválido" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body JSON inválido" }, { status: 400 });
  }

  const content = (body as { content?: string })?.content;
  if (typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json({ ok: false, error: "El campo 'content' es obligatorio" }, { status: 400 });
  }

  try {
    const updated = await prisma.response.update({
      where: { id },
      data: { content: content.trim(), edited: true },
    });
    return NextResponse.json({ ok: true, response: updated }, { status: 200 });
  } catch (err: any) {
    const msg = String(err?.message ?? err);
    const notFound = msg.includes("Record to update not found");
    return NextResponse.json(
      { ok: false, error: notFound ? "Response no encontrada" : msg },
      { status: notFound ? 404 : 500 }
    );
  }
}
