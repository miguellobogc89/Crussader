// app/api/webhooks/whatsapp/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolvePhoneNumber } from "@/lib/whatsapp/phoneNumbers/resolvePhoneNumber";
import { ACTIONS } from "@/lib/crussader-assistant/actions";
import { downloadWhatsAppMedia } from "@/lib/whatsapp/media/downloadWhatsAppMedia";
import { transcribeAudio } from "@/lib/ai/transcribeAudio";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN ?? "";
const WA_DEBUG = process.env.WA_DEBUG === "1";

type WaDebugEvent =
  | {
      kind: "status";
      at: number;
      status: string;
      id?: string;
      to?: string;
      ts?: string;
    }
  | {
      kind: "message";
      at: number;
      from: string;
      id?: string;
      type?: string;
      text?: string;
      ts?: string;
    }
  | {
      kind: "out";
      at: number;
      to: string;
      id?: string;
      text?: string;
      ts?: string;
      status?: string;
    };

const MAX_EVENTS = 50;
const WA_DEBUG_EVENTS: WaDebugEvent[] = [];

function pushEvent(e: WaDebugEvent) {
  WA_DEBUG_EVENTS.unshift(e);

  if (WA_DEBUG_EVENTS.length > MAX_EVENTS) {
    WA_DEBUG_EVENTS.length = MAX_EVENTS;
  }
}

function logWA(tag: string, data?: unknown) {
  if (!WA_DEBUG) {
    return;
  }

  console.log(tag, data);
}

function tsToDate(ts?: unknown): Date | null {
  if (typeof ts !== "string" && typeof ts !== "number") {
    return null;
  }

  const n = Number(ts);

  if (!Number.isFinite(n) || n <= 0) {
    return null;
  }

  return new Date(n * 1000);
}

type WaValue = {
  metadata?: {
    phone_number_id?: string;
    display_phone_number?: string;
  };
  contacts?: Array<{
    wa_id?: string;
    profile?: { name?: string };
  }>;
messages?: Array<{
  from?: string;
  id?: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
audio?: {
  id?: string;
  mime_type?: string;
  sha256?: string;
  url?: string;
  voice?: boolean;
};
}>;
  statuses?: Array<{
    id?: string;
    status?: string;
    timestamp?: string;
    recipient_id?: string;
  }>;
};

async function resolveInstallation(value: WaValue): Promise<{
  installation: any | null;
  companyPhoneNumberId: string | null;
}> {
  const phoneNumberId = value?.metadata?.phone_number_id;
  const displayPhone = value?.metadata?.display_phone_number;

  if (phoneNumberId) {
    const resolved = await resolvePhoneNumber(String(phoneNumberId));

    if (resolved) {
      const inst = await prisma.integration_installation.findFirst({
        where: {
          provider: "whatsapp",
          status: "active",
          company_id: resolved.companyId
        }
      });

      if (inst) {
        return {
          installation: inst,
          companyPhoneNumberId: resolved.phone.id
        };
      }
    }
  }

  if (phoneNumberId) {
    const inst = await prisma.integration_installation.findFirst({
      where: {
        provider: "whatsapp",
        status: "active",
        config: { path: ["phone_number_id"], equals: phoneNumberId }
      }
    });

    if (inst) {
      return {
        installation: inst,
        companyPhoneNumberId: null
      };
    }
  }

  if (displayPhone) {
    const inst = await prisma.integration_installation.findFirst({
      where: {
        provider: "whatsapp",
        status: "active",
        config: { path: ["display_phone_number"], equals: displayPhone }
      }
    });

    if (inst) {
      return {
        installation: inst,
        companyPhoneNumberId: null
      };
    }
  }

  return { installation: null, companyPhoneNumberId: null };
}

async function upsertConversation(args: {
  installationId: string;
  contactExternalId: string;
  contactPhoneE164?: string | null;
  contactName?: string | null;
  providerThreadId?: string | null;
  lastMessageAt?: Date | null;
  companyPhoneNumberId?: string | null;
}) {
  const installationId = args.installationId;
  const contactExternalId = args.contactExternalId;
  const contactPhoneE164 = args.contactPhoneE164;
  const contactName = args.contactName;
  const providerThreadId = args.providerThreadId;
  const lastMessageAt = args.lastMessageAt;
  const companyPhoneNumberId = args.companyPhoneNumberId;

  return prisma.messaging_conversation.upsert({
    where: {
      installation_id_contact_external_id: {
        installation_id: installationId,
        contact_external_id: contactExternalId
      }
    },
    create: {
      installation_id: installationId,
      contact_external_id: contactExternalId,
      contact_phone_e164: contactPhoneE164 ?? null,
      contact_name: contactName ?? null,
      provider_thread_id: providerThreadId ?? null,
      status: "open",
      last_message_at: lastMessageAt ?? null,
      company_phone_number_id: companyPhoneNumberId ?? null
    },
    update: {
      contact_phone_e164: contactPhoneE164 ?? null,
      contact_name: contactName ?? null,
      provider_thread_id: providerThreadId ?? null,
      last_message_at: lastMessageAt ?? undefined,
      updated_at: new Date(),
      company_phone_number_id: companyPhoneNumberId ?? undefined
    }
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  const debug = searchParams.get("debug");

  if (debug === "1") {
    return NextResponse.json({
      ok: true,
      count: WA_DEBUG_EVENTS.length,
      events: WA_DEBUG_EVENTS
    });
  }

  return NextResponse.json({ ok: false }, { status: 403 });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ ok: true });
  }

  const { searchParams } = new URL(req.url);
  const debugPush = searchParams.get("debug_push");

  if (debugPush === "1") {
    const payload = body as any;

    const to = typeof payload.to === "string" ? payload.to : "";
    const text = typeof payload.text === "string" ? payload.text : "";
    const id = typeof payload.id === "string" ? payload.id : undefined;
    const status = typeof payload.status === "string" ? payload.status : "sent";
    const ts = typeof payload.ts === "string" ? payload.ts : undefined;

    if (!to) {
      return NextResponse.json(
        { ok: false, error: "Missing to" },
        { status: 400 }
      );
    }

    pushEvent({
      kind: "out",
      at: Date.now(),
      to,
      id,
      text,
      ts,
      status
    });

    logWA("[WA][OUT][DEV_PUSH]", { to, id, status });

    return NextResponse.json({ ok: true });
  }

  try {
    const entry = body.entry && body.entry[0] ? body.entry[0] : null;
    const change = entry && entry.changes && entry.changes[0] ? entry.changes[0] : null;
    const value: WaValue | null = change ? change.value : null;

    console.log("[WA][RAW_BODY]", JSON.stringify(body, null, 2));
console.log("[WA][VALUE_MESSAGES]", JSON.stringify(value?.messages ?? null, null, 2));

    if (!value) {
      logWA("[WA][SKIP] no value payload");
      return NextResponse.json({ ok: true });
    }

    const now = Date.now();

    const statuses = value.statuses;

    if (Array.isArray(statuses)) {
      for (const s of statuses) {
        pushEvent({
          kind: "status",
          at: now,
          status: String(s.status ?? ""),
          id: s.id ? String(s.id) : undefined,
          to: s.recipient_id ? String(s.recipient_id) : undefined,
          ts: s.timestamp ? String(s.timestamp) : undefined
        });
      }
    }

    const messages = value.messages;

    if (Array.isArray(messages)) {
      for (const m of messages) {
        console.log("[WA][MESSAGE_TYPE]", m.type);
        console.log("[WA][MESSAGE_AUDIO]", JSON.stringify(m.audio ?? null, null, 2));
        let text = "";

        if (m && m.text && typeof m.text.body === "string") {
          text = m.text.body;
        }

        pushEvent({
          kind: "message",
          at: now,
          from: String(m.from ?? ""),
          id: m.id ? String(m.id) : undefined,
          type: m.type ? String(m.type) : undefined,
          text,
          ts: m.timestamp ? String(m.timestamp) : undefined
        });
      }
    }

    const hasIncomingMessages =
      Array.isArray(value.messages) && value.messages.length > 0;

    if (hasIncomingMessages) {
      const m0 = value.messages && value.messages[0] ? value.messages[0] : null;
      const from = m0 && m0.from ? String(m0.from) : null;
      const txt =
        m0 && m0.text && typeof m0.text.body === "string" ? m0.text.body : "";

    }

    const resolvedInst = await resolveInstallation(value);
    const installation = resolvedInst.installation;

    if (!installation) {
      logWA("[WA][SKIP] no installation matched");
      return NextResponse.json({ ok: true });
    }

    if (!hasIncomingMessages) {
      return NextResponse.json({ ok: true });
    }

    const contact =
      Array.isArray(value.contacts) && value.contacts[0] ? value.contacts[0] : null;

    let contactExternalIdRaw: string | null = null;

    if (Array.isArray(value.messages) && value.messages[0] && value.messages[0].from) {
      contactExternalIdRaw = String(value.messages[0].from);
    } else if (contact && contact.wa_id) {
      contactExternalIdRaw = String(contact.wa_id);
    }

    if (!contactExternalIdRaw) {
      logWA("[WA][SKIP] missing contactExternalIdRaw");
      return NextResponse.json({ ok: true });
    }

    const contactName =
      contact && contact.profile && typeof contact.profile.name === "string"
        ? contact.profile.name
        : null;

    const lastTs =
      value.messages && value.messages[0]
        ? tsToDate(value.messages[0].timestamp)
        : null;

    const conv = await upsertConversation({
      installationId: installation.id,
      contactExternalId: contactExternalIdRaw,
      contactPhoneE164: contactExternalIdRaw,
      contactName,
      providerThreadId: null,
      lastMessageAt: lastTs,
      companyPhoneNumberId: resolvedInst.companyPhoneNumberId
    });

    const identify = await ACTIONS.identify_assistant_customer({
      companyId: installation.company_id,
      phone: contactExternalIdRaw
    });

    const assured = await ACTIONS.assure_assistant_customer({
      companyId: installation.company_id,
      phone: contactExternalIdRaw,
      contactName,
      conversationId: conv.id
    });

    const resolvedCustomerId =
      identify.kind === "NONE" ? assured.customerId : identify.customerId;

    if (resolvedCustomerId) {
      await prisma.messaging_conversation.update({
        where: { id: conv.id },
        data: {
          customer_id: resolvedCustomerId
        }
      });
    }

    if (WA_DEBUG) {
      await prisma.messaging_conversation.findUnique({
        where: { id: conv.id },
        select: { customer_id: true, contact_phone_e164: true, contact_name: true }
      });
    }

    const rawMessages = Array.isArray(value.messages) ? value.messages : [];
    const incomingProviderIds: string[] = [];


    console.log("[WA][AUDIO_LOOP][START]", rawMessages.map((m) => ({
  id: m.id,
  type: m.type,
  audioId: m.audio?.id
})));
    for (const m of rawMessages) {
      if (typeof m.id === "string" && m.id.trim() !== "") {
        incomingProviderIds.push(m.id.trim());
      }
    }

    const existingIncomingIds = new Set<string>();

    if (incomingProviderIds.length > 0) {
      const existingIncoming = await prisma.messaging_message.findMany({
        where: {
          conversation_id: conv.id,
          direction: "in",
          provider_message_id: {
            in: incomingProviderIds
          }
        },
        select: {
          provider_message_id: true
        }
      });

      for (const row of existingIncoming) {
        if (typeof row.provider_message_id === "string" && row.provider_message_id.trim() !== "") {
          existingIncomingIds.add(row.provider_message_id.trim());
        }
      }
    }

const rows: Array<{
  conversation_id: string;
  provider_message_id: string | null;
  direction: string;
  kind: string;
  text: string | null;
  status: string | null;
  provider_ts: Date | null;
  payload: any;
  media_id: string | null;
  media_url: string | null;
  mime_type: string | null;
  file_sha256: string | null;
  transcription: string | null;
  transcription_status: string | null;
  transcription_error: string | null;
  media_duration_seconds: number | null;
}> = [];

    const newlyInsertedIncomingIds = new Set<string>();

    for (const m of rawMessages) {
      const providerMessageId =
        typeof m.id === "string" && m.id.trim() !== "" ? m.id.trim() : null;

      if (providerMessageId && existingIncomingIds.has(providerMessageId)) {
        continue;
      }

      let text: string | null = null;

      if (m.type === "text" && m.text && typeof m.text.body === "string") {
        text = m.text.body;
      }

      const providerTs = tsToDate(m.timestamp);

rows.push({
  conversation_id: conv.id,
  provider_message_id: providerMessageId,
  direction: "in",
  kind: m.type ? String(m.type) : "unknown",
  text,
  status: null,
  provider_ts: providerTs,
  payload: m as any,
  media_id: m.type === "audio" ? m.audio?.id ?? null : null,
  media_url: null,
  mime_type: m.type === "audio" ? m.audio?.mime_type ?? "audio/ogg" : null,
  file_sha256: m.type === "audio" ? m.audio?.sha256 ?? null : null,
  transcription: null,
  transcription_status: m.type === "audio" ? "pending" : null,
  transcription_error: null,
  media_duration_seconds: null
});

      if (providerMessageId) {
        newlyInsertedIncomingIds.add(providerMessageId);
      }
    }

if (rows.length > 0) {
  await prisma.messaging_message.createMany({
    data: rows
  });
}

console.log(
  "[WA][AUDIO_LOOP][START]",
  rawMessages.map((m) => ({
    id: m.id,
    type: m.type,
    audioId: m.audio?.id
  }))
);

for (const m of rawMessages) {
  if (m.type !== "audio") {
    continue;
  }

  console.log("[WA][AUDIO_LOOP][MESSAGE]", {
    id: m.id,
    type: m.type,
    audioId: m.audio?.id
  });

  const mediaId =
    m.audio && typeof m.audio.id === "string" ? m.audio.id : null;

  const providerMessageId =
    typeof m.id === "string" && m.id.trim() !== "" ? m.id.trim() : null;

  if (!mediaId || !providerMessageId) {
    continue;
  }

  try {
    console.log("[WA][AUDIO_LOOP][DOWNLOADING]", {
      providerMessageId,
      mediaId
    });

const filePath = await downloadWhatsAppMedia({
  mediaId,
  mediaUrl: m.audio?.url ?? null,
  extension: "ogg"
});
    console.log("[WA][AUDIO_LOOP][DOWNLOADED]", {
      providerMessageId,
      mediaId,
      filePath
    });

    const transcription = await transcribeAudio(filePath);

    console.log("[WA][AUDIO_LOOP][TRANSCRIBED]", {
      providerMessageId,
      transcription
    });

    await prisma.messaging_message.updateMany({
      where: {
        conversation_id: conv.id,
        direction: "in",
        provider_message_id: providerMessageId
      },
      data: {
        media_url: filePath,
        transcription,
        transcription_status: "done"
      }
    });

    if (transcription && transcription.length > 0) {
      let baseUrl = "http://localhost:3000";

      if (process.env.NEXTAUTH_URL && process.env.NEXTAUTH_URL.length > 0) {
        baseUrl = process.env.NEXTAUTH_URL;
      }

      await fetch(`${baseUrl}/api/crussader-assistant/ai-reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          conversationId: conv.id,
          text: transcription
        })
      });
    }
  } catch (error) {
    console.log("[WA][AUDIO_LOOP][ERROR]", error);

    await prisma.messaging_message.updateMany({
      where: {
        conversation_id: conv.id,
        direction: "in",
        provider_message_id: providerMessageId
      },
      data: {
        transcription_status: "failed",
        transcription_error:
          error instanceof Error ? error.message : "Audio processing failed"
      }
    });
  }
}

    const lastIncoming =
      rawMessages.length > 0 ? rawMessages[rawMessages.length - 1] : null;

    const lastIncomingTs = lastIncoming ? tsToDate(lastIncoming.timestamp) : null;

    if (lastIncomingTs) {
      await prisma.messaging_conversation.update({
        where: { id: conv.id },
        data: { last_message_at: lastIncomingTs, updated_at: new Date() }
      });
    }

    if (process.env.WHATSAPP_AUTOREPLY === "1" && lastIncoming) {
      const isText =
        typeof lastIncoming.type === "string" && lastIncoming.type === "text";

      const providerMessageId =
        typeof lastIncoming.id === "string" ? lastIncoming.id.trim() : "";

      let incomingText = "";

      if (lastIncoming.text && typeof lastIncoming.text.body === "string") {
        incomingText = lastIncoming.text.body.trim();
      }

      const hasText = incomingText.length > 0;

      if (isText && hasText && providerMessageId) {
        if (!newlyInsertedIncomingIds.has(providerMessageId)) {
          logWA("[WA][AUTOREPLY][SKIP_DUPLICATE_INBOUND]", {
            conversationId: conv.id,
            providerMessageId
          });

          return NextResponse.json({ ok: true });
        }

        const recentIncoming = await prisma.messaging_message.findMany({
          where: {
            conversation_id: conv.id,
            direction: "in"
          },
          orderBy: [{ provider_ts: "desc" }, { created_at: "desc" }],
          take: 3,
          select: {
            id: true,
            provider_message_id: true,
            provider_ts: true,
            created_at: true,
            text: true
          }
        });

        if (recentIncoming.length > 1) {
          const newest = recentIncoming[0];
          const previous = recentIncoming[1];

          const newestAt = newest.provider_ts ?? newest.created_at;
          const previousAt = previous.provider_ts ?? previous.created_at;

          const diffMs = newestAt.getTime() - previousAt.getTime();

          if (diffMs >= 0 && diffMs < 4000) {
            logWA("[WA][AUTOREPLY][SKIP_TOO_CLOSE]", {
              conversationId: conv.id,
              newestId: newest.provider_message_id,
              previousId: previous.provider_message_id,
              diffMs
            });

            return NextResponse.json({ ok: true });
          }
        }

        try {
          let baseUrl = "http://localhost:3000";

          if (process.env.NEXTAUTH_URL && process.env.NEXTAUTH_URL.length > 0) {
            baseUrl = process.env.NEXTAUTH_URL;
          }

          const r = await fetch(
            `${baseUrl}/api/crussader-assistant/ai-reply?debug=1`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                conversationId: conv.id,
                text: incomingText
              })
            }
          );

          const rawText = await r.text().catch(() => "");

          let j: any = null;

          try {
            j = rawText ? JSON.parse(rawText) : null;
          } catch {
            j = null;
          }

        } catch (e) {
          logWA("[WA][AI_REPLY][ERROR]", e);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    logWA("[WA][ERROR]", err);
    return NextResponse.json({ ok: true });
  }
}