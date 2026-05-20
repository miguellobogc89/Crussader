// app/api/webhooks/whatsapp/slot-recovery/route.ts

import { NextResponse } from "next/server";
import type { WaValue } from "@/lib/slots/slot-recovery/types";
import { handleSlotRecoveryReplies } from "@/lib/slots/slot-recovery/slotRecoveryReplyOrchestrator";
import { handleSlotRecoveryStatuses } from "@/lib/slots/slot-recovery/handleSlotRecoveryStatuses";

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
    const entry = Array.isArray(body.entry) ? body.entry[0] : null;
    const changes = entry && Array.isArray(entry.changes) ? entry.changes : [];
    const change = changes.length > 0 ? changes[0] : null;
    const value: WaValue | null = change && change.value ? change.value : null;


    if (!value) {
      return NextResponse.json({ ok: true });
    }


    await handleSlotRecoveryStatuses(value);
    await handleSlotRecoveryReplies(value);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[WA][SLOT_RECOVERY][ERROR]", error);
    return NextResponse.json({ ok: true });
  }
}