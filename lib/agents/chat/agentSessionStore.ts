// lib/agents/chat/agentSessionStore.ts
import { prisma } from "@/lib/prisma";

export type EnsureWhatsappSessionArgs = {
  agentId: string;
  companyId: string;

  conversationId: string; // messaging_conversation.id
  caller: string; // teléfono cliente (digits)
  callee: string; // phone_number_id o número WA propio
  locationId?: string | null;

  environment?: "TEST" | "PROD";
  language?: string; // default "es"
  model?: string | null;
  temperature?: number | null;

  meta?: Record<string, unknown>;
};

export type EnsureWhatsappSessionResult = {
  sessionId: string;
  isNew: boolean;
};

function coerceString(v: unknown): string {
  return String(v || "").trim();
}

function coerceEnv(v: unknown): "TEST" | "PROD" {
  const s = coerceString(v).toUpperCase();
  if (s === "PROD") return "PROD";
  return "TEST";
}

function normalizePhone(v: unknown): string {
  return String(v || "").replace(/[^\d]/g, "");
}

async function buildInitialMemoryProfile(args: {
  conversationId: string;
  companyId: string;
  caller: string;
}): Promise<Record<string, unknown>> {
  const conversation = await prisma.messaging_conversation.findUnique({
    where: { id: args.conversationId },
    select: {
      customer_id: true,
      contact_phone_e164: true,
      contact_external_id: true,
    },
  });

  let customerId = "";
  let firstName = "";
  let lastName = "";
  let email = "";
  let phone = "";

  const callerPhone = normalizePhone(args.caller);

  if (conversation?.customer_id) {
    const customer = await prisma.customer.findUnique({
      where: { id: conversation.customer_id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        companies: {
          where: {
            companyId: args.companyId,
          },
          select: { id: true },
          take: 1,
        },
      },
    });

    const linkedToCompany =
      customer &&
      Array.isArray(customer.companies) &&
      customer.companies.length > 0;

    if (customer && linkedToCompany) {
      customerId = customer.id;
      firstName = coerceString(customer.firstName);
      lastName = coerceString(customer.lastName);
      email = coerceString(customer.email);
      phone = normalizePhone(customer.phone);
    }
  }

  if (!customerId) {
    const conversationPhone = normalizePhone(
      conversation?.contact_phone_e164 || conversation?.contact_external_id || callerPhone
    );

    const fallbackCustomer = await prisma.customer.findFirst({
      where: {
        OR: [
          { phone: conversationPhone },
          { secondary_phone: conversationPhone },
        ],
        companies: {
          some: {
            companyId: args.companyId,
          },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    });

    if (fallbackCustomer) {
      customerId = fallbackCustomer.id;
      firstName = coerceString(fallbackCustomer.firstName);
      lastName = coerceString(fallbackCustomer.lastName);
      email = coerceString(fallbackCustomer.email);
      phone = normalizePhone(fallbackCustomer.phone);
    } else {
      phone = conversationPhone;
    }
  }

  const profile: Record<string, unknown> = {};

  if (customerId) profile.customerId = customerId;
  if (phone) profile.phone = phone;
  if (firstName) profile.firstName = firstName;
  if (lastName) profile.lastName = lastName;
  if (email) profile.email = email;

  return profile;
}

/**
 * Crea o reutiliza una AgentSession asociada a un messaging_conversation.id
 * guardando esa relación en AgentSession.settings (JSON).
 */
export async function ensureWhatsappAgentSession(
  args: EnsureWhatsappSessionArgs
): Promise<EnsureWhatsappSessionResult> {
  const conversationId = coerceString(args.conversationId);
  if (!conversationId) throw new Error("Missing conversationId");

  const agentId = coerceString(args.agentId);
  const companyId = coerceString(args.companyId);
  if (!agentId || !companyId) throw new Error("Missing agentId/companyId");

  const caller = normalizePhone(args.caller);
  const callee = coerceString(args.callee);
  if (!caller || !callee) throw new Error("Missing caller/callee");

  const environment = coerceEnv(args.environment);
  const language = coerceString(args.language) || "es";

  const existing = await prisma.agentSession.findFirst({
    where: {
      agentId,
      companyId,
      channel: "WHATSAPP",
      endedAt: null,
      settings: {
        path: ["conversationId"],
        equals: conversationId,
      },
    },
    select: { id: true },
    orderBy: { startedAt: "desc" },
  });

  if (existing) {
    return { sessionId: existing.id, isNew: false };
  }

  const initialProfile = await buildInitialMemoryProfile({
    conversationId,
    companyId,
    caller,
  });

  const activeCustomerId =
    typeof initialProfile.customerId === "string"
      ? String(initialProfile.customerId).trim()
      : "";

  const created = await prisma.agentSession.create({
    data: {
      agentId,
      companyId,
      channel: "WHATSAPP",
      status: "INIT",
      caller,
      callee,
      locationId: args.locationId ?? null,
      environment,
      language,
      model: args.model ?? null,
      temperature: args.temperature ?? null,
      settings: {
        conversationId,
        meta: args.meta ?? {},
        sender: {
          phone: caller,
        },
        memory: {
          profile: initialProfile,
          state: {
            activeCustomerId: activeCustomerId || null,
            activeCustomerMode: activeCustomerId ? "sender" : "unknown",
          },
        },
      } as any,
    },
    select: { id: true },
  });

  return { sessionId: created.id, isNew: true };
}

export async function createAgentTurn(args: {
  sessionId: string;
  role: "USER" | "ASSISTANT" | "SYSTEM" | "AGENT" | "TOOL";
  text?: string | null;
  payload?: Record<string, unknown> | null;
}): Promise<void> {
  const sessionId = coerceString(args.sessionId);
  if (!sessionId) throw new Error("Missing sessionId");

  const dbRole: "USER" | "ASSISTANT" | "SYSTEM" | "AGENT" | "TOOL" = args.role;

  await prisma.agentTurn.create({
    data: {
      sessionId,
      role: dbRole,
      text: args.text ?? null,
      payload: (args.payload ?? null) as any,
    },
    select: { id: true },
  });
}