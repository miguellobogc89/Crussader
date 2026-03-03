// lib/agents/chat/agentSessionStore.ts
import { prisma } from "@/lib/prisma";

export type EnsureWhatsappSessionArgs = {
  agentId: string;
  companyId: string;

  conversationId: string; // messaging_conversation.id
  caller: string; // teléfono cliente (E164 normalizado o digits)
  callee: string; // phone_number_id o tu número WA (lo que prefieras registrar)
  locationId?: string | null;

  environment?: "TEST" | "PROD";
  language?: string; // default "es"
  model?: string | null;
  temperature?: number | null;

  // extra meta si quieres
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

/**
 * Crea o reutiliza una AgentSession asociada a un messaging_conversation.id
 * guardando esa relación en AgentSession.settings (JSON).
 *
 * Importante: NO dependemos de status enums (solo endedAt null + settings.conversationId).
 */
export async function ensureWhatsappAgentSession(
  args: EnsureWhatsappSessionArgs
): Promise<EnsureWhatsappSessionResult> {
  const conversationId = coerceString(args.conversationId);
  if (!conversationId) throw new Error("Missing conversationId");

  const agentId = coerceString(args.agentId);
  const companyId = coerceString(args.companyId);
  if (!agentId || !companyId) throw new Error("Missing agentId/companyId");

  const caller = coerceString(args.caller);
  const callee = coerceString(args.callee);
  if (!caller || !callee) throw new Error("Missing caller/callee");

  const environment = coerceEnv(args.environment);
  const language = coerceString(args.language) || "es";

  // 1) Intentar reutilizar sesión abierta para esa conversación
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

  // 2) Crear sesión nueva
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