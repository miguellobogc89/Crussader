// app/api/notifications/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

export async function GET(req: Request, { params }: Params) {
  const { id } = params;

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

export async function DELETE(req: Request, { params }: Params) {
  const { id } = params;

  try {
    await prisma.notification.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(`[DELETE /notifications/${id}]`, error);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}
