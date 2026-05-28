// app/api/whatsapp/messaging/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAndLogWhatsappMessage } from "@/lib/whatsapp/outbound/sendAndLogWhatsappMessage";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const companyId = String(body.companyId || "").trim();
    const conversationId = String(body.conversationId || "").trim();
    const text = String(body.text || "").trim();

    if (!companyId || !conversationId || !text) {
      return NextResponse.json(
        { ok: false, error: "Missing params" },
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
      select: {
        id: true,
        contact_external_id: true,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { ok: false, error: "Conversation not found" },
        { status: 404 },
      );
    }

    const result = await sendAndLogWhatsappMessage({
      to: conversation.contact_external_id,
      text,
      conversationId: conversation.id,
      payload: {
        source: "admin_chat",
      },
    });

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        error: e?.message || "send_failed",
      },
      { status: 500 },
    );
  }
}