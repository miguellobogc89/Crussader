// app/api/whatsapp/messaging/conversations/read/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/whatsapp/messaging/conversations/read
 * Body: { companyId: string, conversationId: string }
 *
 * Marca como leído poniendo last_read_at = now()
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    const companyId =
      body && typeof body.companyId === "string" ? body.companyId : null;
    const conversationId =
      body && typeof body.conversationId === "string" ? body.conversationId : null;

    if (!companyId || !conversationId) {
      return NextResponse.json(
        { ok: false, error: "companyId y conversationId requeridos" },
        { status: 400 }
      );
    }

    // Seguridad: asegúrate de que la conversación pertenece a esa company (via instalación)
    const conv = await prisma.messaging_conversation.findFirst({
      where: {
        id: conversationId,
        integration_installation: {
          company_id: companyId,
          provider: "whatsapp",
          status: "active",
        },
      },
      select: { id: true },
    });

    if (!conv) {
      return NextResponse.json(
        { ok: false, error: "Conversation not found for company" },
        { status: 404 }
      );
    }

    const now = new Date();

    await prisma.messaging_conversation.update({
      where: { id: conversationId },
      data: { last_read_at: now, updated_at: now },
    });

    return NextResponse.json({ ok: true, last_read_at: now.toISOString() });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message || "Error al marcar como leído" },
      { status: 500 }
    );
  }
}