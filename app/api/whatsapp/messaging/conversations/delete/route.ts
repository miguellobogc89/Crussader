// app/api/whatsapp/messaging/conversations/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    const companyId = String(body?.companyId || "").trim();
    const conversationId = String(body?.conversationId || "").trim();

    if (!companyId || !conversationId) {
      return NextResponse.json(
        { ok: false, error: "companyId y conversationId requeridos" },
        { status: 400 },
      );
    }

    const conversation = await prisma.messaging_conversation.findFirst({
      where: {
        id: conversationId,
        integration_installation: {
          company_id: companyId,
          provider: "whatsapp",
        },
      },
      select: { id: true },
    });

    if (!conversation) {
      return NextResponse.json(
        { ok: false, error: "Conversation not found for company" },
        { status: 404 },
      );
    }

    await prisma.messaging_conversation.update({
      where: { id: conversationId },
      data: {
        status: "deleted",
        updated_at: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message || "Error al eliminar conversación" },
      { status: 500 },
    );
  }
}