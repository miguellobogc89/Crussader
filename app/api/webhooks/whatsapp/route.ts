// app/api/webhooks/whatsapp/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN ?? "";

// Buffer simple en memoria (DEV). Guarda los últimos 50 eventos.
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
      kind: "message"; // incoming
      at: number;
      from: string;
      id?: string;
      type?: string;
      text?: string;
      ts?: string;
    }
  | {
      kind: "out"; // outgoing (DEV push)
      at: number;
      to: string;
      id?: string;
      text?: string;
      ts?: string;
      status?: string; // sent/delivered/read
    };

const MAX_EVENTS = 50;
const WA_DEBUG_EVENTS: WaDebugEvent[] = [];

function pushEvent(e: WaDebugEvent) {
  WA_DEBUG_EVENTS.unshift(e);
  if (WA_DEBUG_EVENTS.length > MAX_EVENTS) {
    WA_DEBUG_EVENTS.length = MAX_EVENTS;
  }
}

function tsToDate(ts?: unknown): Date | null {
  if (typeof ts !== "string" && typeof ts !== "number") return null;
  const n = Number(ts);
  if (!Number.isFinite(n) || n <= 0) return null;
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
  }>;
  statuses?: Array<{
    id?: string;
    status?: string;
    timestamp?: string;
    recipient_id?: string;
  }>;
};

async function resolveInstallation(value: WaValue) {
  const phoneNumberId = value?.metadata?.phone_number_id;
  const displayPhone = value?.metadata?.display_phone_number;

  // Buscamos por config.phone_number_id primero (lo normal),
  // y como fallback por config.display_phone_number si lo guardas así.
  // (Asumimos que config guarda strings en JSON)
  if (phoneNumberId) {
    const inst = await prisma.integration_installation.findFirst({
      where: {
        provider: "whatsapp",
        status: "active",
        config: {
          path: ["phone_number_id"],
          equals: phoneNumberId,
        },
      },
    });
    if (inst) return inst;
  }

  if (displayPhone) {
    const inst = await prisma.integration_installation.findFirst({
      where: {
        provider: "whatsapp",
        status: "active",
        config: {
          path: ["display_phone_number"],
          equals: displayPhone,
        },
      },
    });
    if (inst) return inst;
  }

  // Último fallback: si aún no tienes la instalación guardada, no rompemos el webhook.
  return null;
}

async function upsertConversation(args: {
  installationId: string;
  contactExternalId: string;
  contactPhoneE164?: string | null;
  contactName?: string | null;
  providerThreadId?: string | null;
  lastMessageAt?: Date | null;
}) {
  const {
    installationId,
    contactExternalId,
    contactPhoneE164,
    contactName,
    providerThreadId,
    lastMessageAt,
  } = args;

  // Unique: (installation_id, contact_external_id)
  return prisma.messaging_conversation.upsert({
where: {
  installation_id_contact_external_id: {
    installation_id: installationId,
    contact_external_id: contactExternalId,
  },
},
    create: {
      installation_id: installationId,
      contact_external_id: contactExternalId,
      contact_phone_e164: contactPhoneE164 ?? null,
      contact_name: contactName ?? null,
      provider_thread_id: providerThreadId ?? null,
      status: "open",
      last_message_at: lastMessageAt ?? null,
    },
    update: {
      contact_phone_e164: contactPhoneE164 ?? null,
      contact_name: contactName ?? null,
      provider_thread_id: providerThreadId ?? null,
      last_message_at: lastMessageAt ?? undefined,
      updated_at: new Date(),
    },
  });
}

async function autoLinkConversationToCustomer(args: {
  conversationId: string;
  phoneE164: string | null | undefined;
}) {
  const { conversationId, phoneE164 } = args;

  if (!phoneE164) return;

  const matches = await prisma.customer.findMany({
    where: { phone: phoneE164 },
    select: { id: true },
    take: 2,
  });

  if (matches.length !== 1) return;

  await prisma.messaging_conversation.updateMany({
    where: {
      id: conversationId,
      customer_id: null,
    },
    data: {
      customer_id: matches[0].id,
    },
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // 1) Verificación de Meta (cuando viene hub.*)
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  // 2) Debug interno: /api/webhooks/whatsapp?debug=1
  const debug = searchParams.get("debug");
  if (debug === "1") {
    return NextResponse.json({
      ok: true,
      count: WA_DEBUG_EVENTS.length,
      events: WA_DEBUG_EVENTS,
    });
  }

  return NextResponse.json({ ok: false }, { status: 403 });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ ok: true });
  }

  // =========================
  // DEV: push outgoing al buffer
  // POST /api/webhooks/whatsapp?debug_push=1
  // Body: { to, text, id?, status?, ts? }
  // =========================
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
      return NextResponse.json({ ok: false, error: "Missing to" }, { status: 400 });
    }

    pushEvent({
      kind: "out",
      at: Date.now(),
      to,
      id,
      text,
      ts,
      status,
    });

    return NextResponse.json({ ok: true });
  }

  try {
    const entry = body.entry && body.entry[0] ? body.entry[0] : null;
    const change =
      entry && entry.changes && entry.changes[0] ? entry.changes[0] : null;
    const value: WaValue | null = change ? change.value : null;

    console.log("[WA webhook] metadata:", value?.metadata);
    console.log("[WA webhook] contacts:", value?.contacts);
    console.log(
      "[WA webhook] messages count:",
      Array.isArray(value?.messages) ? value.messages.length : 0
    );
    console.log(
      "[WA webhook] statuses count:",
      Array.isArray(value?.statuses) ? value.statuses.length : 0
    );

    const phoneNumberId =
      value && value.metadata && typeof value.metadata.phone_number_id === "string"
        ? value.metadata.phone_number_id
        : null;

    console.log("[WA webhook] phone_number_id:", phoneNumberId);

    let waId: string | null = null;
    if (Array.isArray(value?.contacts) && value.contacts.length > 0) {
      const c0 = value.contacts[0];
      if (c0 && c0.wa_id) {
        waId = String(c0.wa_id);
      }
    }

    console.log("[WA webhook] contact wa_id:", waId);

    const now = Date.now();

    // 1) Guarda debug en memoria (como ya tenías)
    const statuses = value && value.statuses ? value.statuses : null;
    if (Array.isArray(statuses)) {
      for (const s of statuses) {
        pushEvent({
          kind: "status",
          at: now,
          status: String(s.status ?? ""),
          id: s.id ? String(s.id) : undefined,
          to: s.recipient_id ? String(s.recipient_id) : undefined,
          ts: s.timestamp ? String(s.timestamp) : undefined,
        });
      }
    }

    const messages = value && value.messages ? value.messages : null;
    if (Array.isArray(messages)) {
      for (const m of messages) {
        const text =
          m && m.text && typeof m.text.body === "string" ? m.text.body : "";

        pushEvent({
          kind: "message",
          at: now,
          from: String(m.from ?? ""),
          id: m.id ? String(m.id) : undefined,
          type: m.type ? String(m.type) : undefined,
          text,
          ts: m.timestamp ? String(m.timestamp) : undefined,
        });
      }
    }

    // 2) Persistencia en DB (si podemos resolver instalación)
    if (!value) {
      console.log("[WA webhook] no value payload");
      return NextResponse.json({ ok: true });
    }

    const installation = await resolveInstallation(value);

    // Si aún no has guardado la installation/config, no rompemos el webhook
    if (!installation) {
      console.log("[WA webhook] no installation matched (skip DB persist)");
      return NextResponse.json({ ok: true });
    }

    // Contact info (solo viene en algunos payloads)
    const contact =
      Array.isArray(value.contacts) && value.contacts[0] ? value.contacts[0] : null;
    const contactExternalIdRaw =
      Array.isArray(value.messages) && value.messages[0] && value.messages[0].from
        ? String(value.messages[0].from)
        : contact && contact.wa_id
          ? String(contact.wa_id)
          : null;

    const hasIncomingMessages = Array.isArray(value.messages) && value.messages.length > 0;

    let conversationId: string | null = null;

    if (hasIncomingMessages && contactExternalIdRaw) {
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
      });

      conversationId = conv.id;
      await autoLinkConversationToCustomer({
        conversationId: conv.id,
        phoneE164: contactExternalIdRaw,
      });

      // Inserta mensajes entrantes
      await prisma.$transaction(async (tx) => {
        for (const m of value.messages || []) {
          const providerMessageId = m.id ? String(m.id) : null;

          const text =
            m && m.text && typeof m.text.body === "string" ? m.text.body : null;

          const providerTs = tsToDate(m.timestamp);

          await tx.messaging_message.create({
            data: {
              conversation_id: conv.id,
              provider_message_id: providerMessageId,
              direction: "in",
              kind: m.type ? String(m.type) : "unknown",
              text,
              status: null,
              provider_ts: providerTs,
              payload: m as any,
            },
          });
        }
      });

      // Recalcula last_message_at con el último mensaje entrante
      const lastIncoming = value.messages?.length
        ? value.messages[value.messages.length - 1]
        : null;
      const lastIncomingTs = lastIncoming ? tsToDate(lastIncoming.timestamp) : null;
      if (lastIncomingTs) {
        await prisma.messaging_conversation.update({
          where: { id: conv.id },
          data: { last_message_at: lastIncomingTs, updated_at: new Date() },
        });
      }
    }

    // Status updates
    if (Array.isArray(value.statuses) && value.statuses.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (const s of value.statuses || []) {
          const msgId = s.id ? String(s.id) : null;
          const st = s.status ? String(s.status) : null;
          const providerTs = tsToDate(s.timestamp);

          // 1) Si existe el mensaje, actualiza su status
          if (msgId) {
            const updated = await tx.messaging_message.updateMany({
              where: { provider_message_id: msgId },
              data: { status: st },
            });

            if (updated.count > 0) {
              continue;
            }
          }

          // 2) Si no existe el mensaje, intentamos resolver conversación
          if (!conversationId) {
            if (msgId) {
              const existing = await tx.messaging_message.findFirst({
                where: { provider_message_id: msgId },
                select: { conversation_id: true },
              });
              if (existing) {
                conversationId = existing.conversation_id;
              }
            }
          }

          if (!conversationId) {
            continue;
          }

          await tx.messaging_message.create({
            data: {
              conversation_id: conversationId,
              provider_message_id: msgId,
              direction: "system",
              kind: "status",
              text: null,
              status: st,
              provider_ts: providerTs,
              payload: s as any,
            },
          });

          if (providerTs) {
            await tx.messaging_conversation.update({
              where: { id: conversationId },
              data: { last_message_at: providerTs, updated_at: new Date() },
            });
          }
        }
      });
    }

    console.log("[WA webhook] stored events:", WA_DEBUG_EVENTS.length);
  } catch (err) {
    console.log("[WA webhook] parse error", err);
  }

  return NextResponse.json({ ok: true });
}