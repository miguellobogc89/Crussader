import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 👇 Ahora params viene como Promise<{ id: string }>
type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;

  try {
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }

    return NextResponse.json(notification);
  } catch (error) {
    console.error(`[GET /notifications/${id}]`, error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;

  try {
    await prisma.notification.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(`[DELETE /notifications/${id}]`, error);
    return NextResponse.json(
      { error: "Error al eliminar" },
      { status: 500 },
    );
  }
}

// 👇 NUEVO: marcar leída / no leída (o actualizar otros campos)
export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;

  try {
    const body = await req.json().catch(() => ({} as any));
    const nextStatus: string | undefined = body.status;
    const nextRead: boolean | undefined = body.read;

    const data: any = {};

    // Si viene `read`, lo traducimos a status "read"/"unread"
    if (typeof nextRead === "boolean") {
      data.status = nextRead ? "read" : "unread";
    }

    // Si viene `status` explícito, tiene prioridad
    if (typeof nextStatus === "string" && nextStatus.trim()) {
      data.status = nextStatus.trim().toLowerCase();
    }

    if (!Object.keys(data).length) {
      return NextResponse.json(
        { error: "Nada que actualizar" },
        { status: 400 },
      );
    }

    const updated = await prisma.notification.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(`[PATCH /notifications/${id}]`, error);
    return NextResponse.json(
      { error: "Error al actualizar" },
      { status: 500 },
    );
  }
}
