// app/api/webhooks/whatsapp/route.ts

import { NextResponse } from "next/server";
import type { WaValue } from "@/lib/whatsapp/webhooks/types";
import { whatsappReplyOrchestrator } from "@/lib/whatsapp/whatsappReplyOrchestrator";
import { handleWhatsappStatuses } from "@/lib/whatsapp/webhooks/handleWhatsappStatuses";

const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ?? "";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ ok: false }, { status: 403 });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ ok: true });
  }

  try {
    const entries = Array.isArray(body.entry) ? body.entry : [];

    for (const entry of entries) {
      const changes = Array.isArray(entry?.changes) ? entry.changes : [];

      for (const change of changes) {
        const value: WaValue | null = change?.value ? change.value : null;

        if (!value) {
          continue;
        }

        if (Array.isArray(value.statuses) && value.statuses.length > 0) {
          await handleWhatsappStatuses(value);
        }

        if (Array.isArray(value.messages) && value.messages.length > 0) {
          for (const message of value.messages) {
            await whatsappReplyOrchestrator({
              message,
            });
          }
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[WA][WEBHOOK][ERROR]", error);
    return NextResponse.json({ ok: true });
  }
}