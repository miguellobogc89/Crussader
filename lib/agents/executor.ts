// lib/agents/executor.ts
import type { AgentIntent, AgentRequest, AgentResult } from "@/lib/agents/contract";
import { AgentRequestSchema } from "@/lib/agents/contract";

/**
 * Allowlist por agente: define qué intents puede ejecutar cada tipo de agente.
 * (Luego lo moveremos a BBDD / config por company si quieres.)
 */
const ALLOWED_INTENTS_BY_AGENT: Record<string, Set<AgentIntent>> = {
  whatsapp: new Set([
    "faq_query",
    "lookup_entity",
    "list_options",
    "create_record",
    "update_record",
    "handoff_human",
  ]),
  reviews: new Set(["faq_query", "lookup_entity", "handoff_human"]),
  voice: new Set([
    "faq_query",
    "lookup_entity",
    "list_options",
    "create_record",
    "update_record",
    "handoff_human",
  ]),
};

/**
 * Punto único de entrada para ejecutar acciones provenientes de la IA.
 * - Valida contrato (zod)
 * - Comprueba allowlist por agente
 * - Ejecuta handler del intent
 */
export async function executeAgentAction(input: unknown): Promise<AgentResult> {
  const parsed = AgentRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid agent request" };
  }

  const req: AgentRequest = parsed.data;
  const allowed = ALLOWED_INTENTS_BY_AGENT[req.agentKey];

  if (!allowed) {
    return { ok: false, error: `Unknown agentKey: ${req.agentKey}` };
  }

  if (!allowed.has(req.action.intent)) {
    return {
      ok: false,
      error: `Intent not allowed for agent ${req.agentKey}: ${req.action.intent}`,
    };
  }

  // Dispatch por intent
  switch (req.action.intent) {
    case "faq_query":
      return handleFaqQuery(req);

    case "lookup_entity":
      return handleLookupEntity(req);

    case "list_options":
      return handleListOptions(req);

    case "create_record":
      return handleCreateRecord(req);

    case "update_record":
      return handleUpdateRecord(req);

    case "handoff_human":
      return handleHandoffHuman(req);

    default:
      return { ok: false, error: "Unhandled intent" };
  }
}

// ==========================
// Handlers (stubs por ahora)
// ==========================

async function handleFaqQuery(_req: AgentRequest): Promise<AgentResult> {
  // Aquí luego: knowledge + policy + respuesta (o data para la IA)
  return { ok: true, data: { note: "faq_query stub" } };
}

async function handleLookupEntity(_req: AgentRequest): Promise<AgentResult> {
  // Aquí luego: lookup de customer / appointment / review etc.
  return { ok: true, data: { note: "lookup_entity stub" } };
}

async function handleListOptions(_req: AgentRequest): Promise<AgentResult> {
  // Aquí luego: availability slots, servicios, horarios…
  return { ok: true, data: { note: "list_options stub" } };
}

async function handleCreateRecord(_req: AgentRequest): Promise<AgentResult> {
  // Aquí luego: crear appointment/lead/etc con validación e idempotency
  return { ok: true, data: { note: "create_record stub" } };
}

async function handleUpdateRecord(_req: AgentRequest): Promise<AgentResult> {
  // Aquí luego: confirmar/cancelar/reprogramar, etc.
  return { ok: true, data: { note: "update_record stub" } };
}

async function handleHandoffHuman(_req: AgentRequest): Promise<AgentResult> {
  // Aquí luego: marcar conversación para humano, asignación, etc.
  return { ok: true, data: { note: "handoff_human stub" } };
}