// app/api/webhooks/whatsapp/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN ?? "";
const WA_DEBUG = process.env.WA_DEBUG === "1";

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


function logWA(tag: string, data?: any) {
  if (!WA_DEBUG) return;
  if (data !== undefined) {
    console.log(tag, data);
  } else {
    console.log(tag);
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
  companyId: string;
}) {
  const { conversationId, phoneE164, companyId } = args;
  if (!phoneE164) return;

  const matches = await prisma.customer.findMany({
    where: {
      phone: phoneE164,
      companies: {
        some: {
          companyId: companyId,
        },
      },
    },
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
  if (!body) return NextResponse.json({ ok: true });

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

    logWA("[WA][OUT][DEV_PUSH]", { to, id, status });

    return NextResponse.json({ ok: true });
  }

  try {
    const entry = body.entry && body.entry[0] ? body.entry[0] : null;
    const change = entry && entry.changes && entry.changes[0] ? entry.changes[0] : null;
    const value: WaValue | null = change ? change.value : null;

    if (!value) {
      logWA("[WA][SKIP] no value payload");
      return NextResponse.json({ ok: true });
    }

    const now = Date.now();

    // Guardamos SIEMPRE en buffer (DEV) para inspección, pero NO spameamos la consola.
    const statuses = value.statuses;
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

    const messages = value.messages;
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

    const hasIncomingMessages = Array.isArray(value.messages) && value.messages.length > 0;

    // LOG 1: solo cuando hay mensaje real
    if (hasIncomingMessages) {
      const m0 = value.messages && value.messages[0] ? value.messages[0] : null;
      const from = m0 && m0.from ? String(m0.from) : null;
      const txt =
        m0 && m0.text && typeof m0.text.body === "string" ? m0.text.body : "";
      logWA("[WA][IN]", { from, text: txt });
    }

    // Resolve installation
    const installation = await resolveInstallation(value);
    if (!installation) {
      logWA("[WA][SKIP] no installation matched");
      return NextResponse.json({ ok: true });
    }

    // Si es SOLO status update, no hacemos más (evita ruido y trabajo)
    if (!hasIncomingMessages) {
      // Opcional: persistir status en DB (si lo quieres). Por defecto lo dejamos silencioso.
      // Si en algún momento quieres persistir statuses aquí también, lo hacemos con WA_DEBUG o flag.
      return NextResponse.json({ ok: true });
    }

    // Contact info
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
      value.messages && value.messages[0] ? tsToDate(value.messages[0].timestamp) : null;

    const conv = await upsertConversation({
      installationId: installation.id,
      contactExternalId: contactExternalIdRaw,
      contactPhoneE164: contactExternalIdRaw,
      contactName,
      providerThreadId: null,
      lastMessageAt: lastTs,
    });

    async function resolveCustomerScope(args: { phoneE164: string; companyId: string }) {
  const { phoneE164, companyId } = args;

  const customer = await prisma.customer.findFirst({
    where: { phone: phoneE164 },
    select: { id: true, firstName: true, lastName: true },
  });

  if (!customer) {
    return { scope: "NONE" as const, customer: null, companyLink: null };
  }

  const link = await prisma.companyCustomer.findUnique({
    where: {
      companyId_customerId: {
        companyId,
        customerId: customer.id,
      },
    },
    select: { id: true },
  });

  if (!link) {
    return { scope: "EXISTS_OTHER_COMPANY" as const, customer, companyLink: null };
  }

  return { scope: "KNOWN_THIS_COMPANY" as const, customer, companyLink: link };
}

const scopeInfo = await resolveCustomerScope({
  phoneE164: contactExternalIdRaw,
  companyId: installation.company_id,
});

logWA("[WA][CUSTOMER_SCOPE]", {
  conversationId: conv.id,
  scope: scopeInfo.scope,
  customerId: scopeInfo.customer ? scopeInfo.customer.id : null,
});

    await autoLinkConversationToCustomer({
      conversationId: conv.id,
      phoneE164: contactExternalIdRaw,
      companyId: installation.company_id,
    });

    // LOG 2: customer state (resumen)
    if (WA_DEBUG) {
      const c = await prisma.messaging_conversation.findUnique({
        where: { id: conv.id },
        select: { customer_id: true, contact_phone_e164: true, contact_name: true },
      });

      if (c && c.customer_id) {
        logWA("[WA][CUSTOMER]", {
          conversationId: conv.id,
          status: "KNOWN",
          customerId: c.customer_id,
        });
      } else {
        logWA("[WA][CUSTOMER]", { conversationId: conv.id, status: "NEW" });
      }
    }

    // Insert incoming messages
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

    // Update last_message_at with last incoming timestamp
    const lastIncoming = value.messages && value.messages.length > 0
      ? value.messages[value.messages.length - 1]
      : null;

    const lastIncomingTs = lastIncoming ? tsToDate(lastIncoming.timestamp) : null;

    if (lastIncomingTs) {
      await prisma.messaging_conversation.update({
        where: { id: conv.id },
        data: { last_message_at: lastIncomingTs, updated_at: new Date() },
      });
    }

    // ==========================
    // AUTO-REPLY IA (MVP)
    // ==========================
    if (process.env.WHATSAPP_AUTOREPLY === "1" && lastIncoming) {
      const isText = typeof lastIncoming.type === "string" && lastIncoming.type === "text";

      let incomingText = "";
      if (lastIncoming.text && typeof lastIncoming.text.body === "string") {
        incomingText = lastIncoming.text.body;
      }

      const hasText = incomingText.trim().length > 0;

      if (isText && hasText) {
        try {
          let baseUrl = "http://localhost:3000";
          if (process.env.NEXTAUTH_URL && process.env.NEXTAUTH_URL.length > 0) {
            baseUrl = process.env.NEXTAUTH_URL;
          }

          const r = await fetch(
            `${baseUrl}/api/integrations/meta/whatsapp/ai-reply?debug=1`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                conversationId: conv.id,
                text: incomingText,
              }),
            }
          );

          const j = await r.json().catch(() => null);

          

          // LOG 6: salida del ai-reply (resumen)
          logWA("[WA][AI_REPLY]", {
            conversationId: conv.id,
            status: r.status,
            ok: Boolean(j && j.ok),
            botTextPreview: j && typeof j.botText === "string" ? j.botText.slice(0, 80) : null,
          });
        } catch (e) {
          logWA("[WA][AI_REPLY][ERROR]", e);
        }
      }
    }

    // Nota: statuses se siguen guardando en buffer (dev) pero ya no ensucian consola.
    // Si quieres persistir statuses en DB, lo hacemos en un siguiente paso con una flag.

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[WA webhook] error:", err);
    return NextResponse.json({ ok: true });
  }
}