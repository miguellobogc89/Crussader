// app/api/integrations/meta/whatsapp/send-test/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

function normalizePhone(p: string) {
  return p.replace(/[^\d]/g, "");
}

export async function POST(req: Request) {
  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    return NextResponse.json(
      { ok: false, error: "Missing WhatsApp env vars" },
      { status: 500 }
    );
  }

  const parsed = await req.json().catch(() => ({ to: null, body: "" }));
  const toRaw = parsed?.to;
  const body = typeof parsed?.body === "string" ? parsed.body.trim() : "";

  if (!toRaw) {
    return NextResponse.json(
      { ok: false, error: "Missing 'to' number" },
      { status: 400 }
    );
  }

  const to = normalizePhone(String(toRaw));

  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body },
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: "Meta rejected the request", meta_error: data },
        { status: 400 }
      );
    }

    const providerMessageId =
      data?.messages?.[0]?.id ? String(data.messages[0].id) : null;

    // 🔥 BUSCAR CONVERSACIÓN EXISTENTE SIN DEPENDER DEL UNIQUE EXACTO
    const installation = await prisma.integration_installation.findFirst({
      where: {
        provider: "whatsapp",
        status: "active",
        config: {
          path: ["phone_number_id"],
          equals: PHONE_NUMBER_ID,
        },
      },
    });

    if (!installation) {
      return NextResponse.json({
        ok: true,
        data,
        debug: { warning: "No installation found" },
      });
    }

    // Buscar conversación existente por teléfono normalizado
    let conversation = await prisma.messaging_conversation.findFirst({
      where: {
        installation_id: installation.id,
        OR: [
          { contact_external_id: to },
          { contact_phone_e164: to },
        ],
      },
    });

    if (!conversation) {
      conversation = await prisma.messaging_conversation.create({
        data: {
          installation_id: installation.id,
          contact_external_id: to,
          contact_phone_e164: to,
          contact_name: null,
          status: "open",
          last_message_at: new Date(),
        },
      });
    } else {
      await prisma.messaging_conversation.update({
        where: { id: conversation.id },
        data: {
          last_message_at: new Date(),
          updated_at: new Date(),
        },
      });
    }

    await prisma.messaging_message.create({
      data: {
        conversation_id: conversation.id,
        provider_message_id: providerMessageId,
        direction: "out",
        kind: "text",
        text: body,
        status: "sent",
        provider_ts: new Date(),
        payload: data ?? {},
      },
    });

    return NextResponse.json({
      ok: true,
      data,
      debug: {
        providerMessageId,
        conversationId: conversation.id,
      },
    });
  } catch (err) {
    console.error("[WA send-test] error:", err);
    return NextResponse.json(
      { ok: false, error: "Request failed" },
      { status: 500 }
    );
  }
}