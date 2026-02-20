// app/api/integrations/meta/whatsapp/send-test/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

async function pushOutToDevBuffer(req: Request, args: {
  to: string;
  text: string | null;
  providerMessageId: string | null;
  status: string;
}) {
  try {
    // IMPORTANT: no dependemos de NEXT_PUBLIC_APP_URL.
    // Usamos el origin real del request (vale en local y en prod).
    const origin = new URL(req.url).origin;

    await fetch(`${origin}/api/webhooks/whatsapp?debug_push=1`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: args.to,
        text: args.text ?? "",
        id: args.providerMessageId ?? undefined,
        status: args.status,
      }),
      cache: "no-store",
    });
  } catch {
    // DEV only: si falla no rompemos el envío
  }
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

  const to = String(toRaw);

  const payload =
    body.length > 0
      ? {
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body },
        }
      : {
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: "hello_world",
            language: { code: "en_US" },
          },
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
      data &&
      data.messages &&
      data.messages[0] &&
      data.messages[0].id
        ? String(data.messages[0].id)
        : null;

    // ===============================
    // DEV: push al buffer en memoria
    // ===============================
    await pushOutToDevBuffer(req, {
      to,
      text: body.length > 0 ? body : "(template: hello_world)",
      providerMessageId,
      status: "sent",
    });

    // ===============================
    // Persistencia en DB (mensaje OUT)
    // ===============================

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

    if (installation) {
      const conversation = await prisma.messaging_conversation.upsert({
        where: {
          installation_id_contact_external_id: {
            installation_id: installation.id,
            contact_external_id: to,
          },
        },
        create: {
          installation_id: installation.id,
          contact_external_id: to,
          contact_phone_e164: to,
          contact_name: null,
          status: "open",
          last_message_at: new Date(),
        },
        update: {
          last_message_at: new Date(),
          updated_at: new Date(),
        },
      });

      await prisma.messaging_message.create({
        data: {
          conversation_id: conversation.id,
          provider_message_id: providerMessageId,
          direction: "out",
          kind: payload.type,
          text: body.length > 0 ? body : null,
          status: "sent",
          provider_ts: new Date(),
          payload: data ?? {},
        },
      });
    }

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error("[WA send-test] error:", err);
    return NextResponse.json({ ok: false, error: "Request failed" }, { status: 500 });
  }
}