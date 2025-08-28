// app/api/responses/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/responses/:id  → actualiza el contenido de una Response
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { ok: false, error: "Parámetro 'id' inválido" },
        { status: 400 }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "Body JSON inválido" },
        { status: 400 }
      );
    }

    const content = body?.content;
    if (typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { ok: false, error: "El campo 'content' es obligatorio" },
        { status: 400 }
      );
    }

    // Opcional: aquí podrías validar permisos (usuario logado, rol, etc.)

    const updated = await prisma.response.update({
      where: { id },
      data: {
        content: content.trim(),
        edited: true,
        // Opcional: marca quién editó si tienes sesión
        // editedById: session?.user?.id ?? null,
        // No tocamos status/published aquí; solo contenido/edited
      },
    });

    return NextResponse.json({ ok: true, response: updated }, { status: 200 });
  } catch (err: any) {
    // Si el id no existe, Prisma lanza error. Devolvemos 404 amigable.
    const msg = String(err?.message ?? err);
    const notFound = msg.includes("Record to update not found");
    return NextResponse.json(
      { ok: false, error: notFound ? "Response no encontrada" : msg },
      { status: notFound ? 404 : 500 }
    );
  }
}
