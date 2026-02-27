// lib/agents/executor.ts
import type { AgentIntent, AgentRequest, AgentResult } from "@/lib/agents/contract";
import { AgentRequestSchema } from "@/lib/agents/contract";
import { prisma } from "@/lib/prisma";
import { AppointmentStatus } from "@prisma/client";
import { AGENT_ENTITY_REGISTRY } from "./entities";

type AgentTraceStep = {
  kind: string;
  at?: number;
  summary?: string;
  data?: Record<string, any>;
};

type AgentTrace = {
  agentKey: string;
  requestId?: string;
  steps: AgentTraceStep[];
};

type ExecuteOptions = {
  debug?: boolean;
  requestId?: string;
};

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

function pushTrace(trace: AgentTrace | null, step: AgentTraceStep) {
  if (!trace) return;
  trace.steps.push({
    at: Date.now(),
    ...step,
  });
}

/**
 * Punto único de entrada para ejecutar acciones provenientes de la IA.
 * - Valida contrato (zod)
 * - Comprueba allowlist por agente
 * - Ejecuta handler del intent
 * - (Opcional) genera trace estructurado si debug=true
 */
export async function executeAgentAction(
  input: unknown,
  options?: ExecuteOptions
): Promise<AgentResult & { trace?: AgentTrace }> {
  const parsed = AgentRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid agent request" };
  }

  const req: AgentRequest = parsed.data;

  const trace: AgentTrace | null = options?.debug
    ? { agentKey: req.agentKey, requestId: options?.requestId, steps: [] }
    : null;

  const allowed = ALLOWED_INTENTS_BY_AGENT[req.agentKey];

  pushTrace(trace, {
    kind: "understanding",
    summary: "Parsed agent request",
    data: {
      agentKey: req.agentKey,
      companyId: req.companyId,
      locationId: req.locationId ?? null,
      intent: req.action.intent,
      args: req.action.args ?? {},
    },
  });

  if (!allowed) {
    const out = { ok: false, error: `Unknown agentKey: ${req.agentKey}` };
    pushTrace(trace, { kind: "decision", summary: out.error });
    if (trace) return { ...out, trace };
    return out;
  }

  if (!allowed.has(req.action.intent)) {
    const out = {
      ok: false,
      error: `Intent not allowed for agent ${req.agentKey}: ${req.action.intent}`,
    };
    pushTrace(trace, { kind: "decision", summary: out.error });
    if (trace) return { ...out, trace };
    return out;
  }

  // Pequeño "plan" (muy útil para debug UI)
  if (req.action.intent === "lookup_entity") {
    const entityRaw = typeof req.action.args?.entity === "string" ? req.action.args.entity : "";
    const queryRaw = typeof req.action.args?.query === "string" ? req.action.args.query : "";
    const scopeRaw = typeof req.action.args?.scope === "string" ? req.action.args.scope : "";

    const entity = entityRaw.trim();
    const query = queryRaw.trim();
    const scope = scopeRaw.trim();

    const nextActions: Array<any> = [];

    if (entity === "service" && query) {
      nextActions.push({ action: "lookup_entity", entity: "service", query, scope: { companyId: req.companyId } });
      nextActions.push({ action: "lookup_entity", entity: "knowledge", query, scope: { companyId: req.companyId } });
    }

    if (entity === "appointment" && scope === "next") {
      nextActions.push({ action: "lookup_entity", entity: "appointment", scope: "next", scope2: { companyId: req.companyId } });
    }

    if (nextActions.length > 0) {
      pushTrace(trace, {
        kind: "plan",
        summary: "Planned backend lookups",
        data: { nextActions },
      });
    }
  }

  let result: AgentResult;

  switch (req.action.intent) {
    case "faq_query":
      result = await handleFaqQuery(req, trace);
      break;

    case "lookup_entity":
      result = await handleLookupEntity(req, trace);
      break;

    case "list_options":
      result = await handleListOptions(req, trace);
      break;

    case "create_record":
      result = await handleCreateRecord(req, trace);
      break;

    case "update_record":
      result = await handleUpdateRecord(req, trace);
      break;

    case "handoff_human":
      result = await handleHandoffHuman(req, trace);
      break;

    default:
      result = { ok: false, error: "Unhandled intent" };
      break;
  }

  pushTrace(trace, {
    kind: "decision",
    summary: "Executor returned result",
    data: { ok: result.ok, error: result.error ?? null },
  });

  if (trace) return { ...result, trace };
  return result;
}

// ==========================
// Handlers
// ==========================

async function handleFaqQuery(_req: AgentRequest, trace: AgentTrace | null): Promise<AgentResult> {
  pushTrace(trace, { kind: "action", summary: "faq_query stub", data: {} });
  return { ok: true, data: { note: "faq_query stub" } };
}

async function handleLookupEntity(req: AgentRequest, trace: AgentTrace | null): Promise<AgentResult> {
  if (!req.companyId) {
    pushTrace(trace, { kind: "decision", summary: "Missing companyId" });
    return { ok: false, error: "Missing companyId" };
  }

  const entityRaw =
    req.action.args && typeof req.action.args.entity === "string"
      ? req.action.args.entity
      : "";

  const entity = entityRaw.trim();

  // =========================
  // 1) Lookup: SERVICE
  // args: { entity:"service", query:"endodoncia" }
  // =========================
  if (entity === "service") {
    const queryRaw =
      req.action.args && typeof req.action.args.query === "string"
        ? req.action.args.query
        : "";

    const query = queryRaw.trim();
    if (!query) {
      pushTrace(trace, { kind: "decision", summary: "Missing query for service lookup" });
      return { ok: false, error: "Missing query for service lookup" };
    }

    const reg = AGENT_ENTITY_REGISTRY.service;
    if (!reg || reg.allowLookup !== true) {
      pushTrace(trace, { kind: "decision", summary: "Service lookup not allowed" });
      return { ok: false, error: "Service lookup not allowed" };
    }

    pushTrace(trace, {
      kind: "action",
      summary: "DB lookup: service by name (contains insensitive)",
      data: { entity: "service", query, companyId: req.companyId },
    });

    const services = await prisma.service.findMany({
      where: {
        location: { companyId: req.companyId },
        active: true,
        name: { contains: query, mode: "insensitive" },
      },
      take: 5,
      select: {
        id: true,
        name: true,
        durationMin: true,
        bufferBeforeMin: true,
        bufferAfterMin: true,
        price: true,
        priceCents: true,
        locationId: true,
      },
      orderBy: { name: "asc" },
    });

    pushTrace(trace, {
      kind: "action",
      summary: "DB result: service candidates",
      data: {
        count: services.length,
        bestMatchId: services.length > 0 ? services[0].id : null,
        bestMatchName: services.length > 0 ? services[0].name : null,
      },
    });

    if (services.length === 0) {
      return {
        ok: true,
        data: {
          entity: "service",
          found: false,
          query,
          candidates: [],
        },
      };
    }

    return {
      ok: true,
      data: {
        entity: "service",
        found: true,
        query,
        bestMatch: services[0],
        candidates: services,
      },
    };
  }

  // =========================
  // 2) Lookup: NEXT APPOINTMENT
  // args: { entity:"appointment", scope:"next" }
  // =========================
  const scopeRaw =
    req.action.args && typeof req.action.args.scope === "string"
      ? req.action.args.scope
      : "";

  const scope = scopeRaw.trim();

  if (entity === "appointment" && scope === "next") {
    const customerId = req.customerId ? req.customerId : null;
    const phone = req.customerPhoneE164 ? req.customerPhoneE164 : null;

    if (!customerId && !phone) {
      pushTrace(trace, { kind: "decision", summary: "Missing customer identity (customerId/phone)" });
      return { ok: false, error: "Missing customer identity (customerId/phone)" };
    }

    const now = new Date();

    pushTrace(trace, {
      kind: "action",
      summary: "DB lookup: next appointment",
      data: { companyId: req.companyId, hasCustomerId: Boolean(customerId), hasPhone: Boolean(phone) },
    });

    const appt = await prisma.appointment.findFirst({
      where: {
        location: { companyId: req.companyId },
        startAt: { gte: now },
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.BOOKED] },
        ...(customerId ? { customerId: customerId } : { customerPhone: phone }),
      },
      orderBy: { startAt: "asc" },
      select: {
        id: true,
        startAt: true,
        endAt: true,
        status: true,
        customerName: true,
        customerPhone: true,
        customerEmail: true,
        notes: true,
        service: { select: { id: true, name: true, durationMin: true } },
        employee: { select: { id: true, name: true } },
        resource: { select: { id: true, name: true } },
        location: { select: { id: true } },
      },
    });

    pushTrace(trace, {
      kind: "action",
      summary: "DB result: next appointment",
      data: { found: Boolean(appt), appointmentId: appt ? appt.id : null },
    });

    if (!appt) {
      return { ok: true, data: { entity: "appointment", scope: "next", found: false } };
    }

    return { ok: true, data: { entity: "appointment", scope: "next", found: true, appointment: appt } };
  }

  pushTrace(trace, {
    kind: "decision",
    summary: "lookup_entity unsupported args",
    data: { entity, args: req.action.args ?? {} },
  });

  return { ok: true, data: { note: "lookup_entity: no-op (unsupported args)" } };
}

async function handleListOptions(_req: AgentRequest, trace: AgentTrace | null): Promise<AgentResult> {
  pushTrace(trace, { kind: "action", summary: "list_options stub", data: {} });
  return { ok: true, data: { note: "list_options stub" } };
}

async function handleCreateRecord(_req: AgentRequest, trace: AgentTrace | null): Promise<AgentResult> {
  pushTrace(trace, { kind: "action", summary: "create_record stub", data: {} });
  return { ok: true, data: { note: "create_record stub" } };
}

async function handleUpdateRecord(_req: AgentRequest, trace: AgentTrace | null): Promise<AgentResult> {
  pushTrace(trace, { kind: "action", summary: "update_record stub", data: {} });
  return { ok: true, data: { note: "update_record stub" } };
}

async function handleHandoffHuman(_req: AgentRequest, trace: AgentTrace | null): Promise<AgentResult> {
  pushTrace(trace, { kind: "action", summary: "handoff_human stub", data: {} });
  return { ok: true, data: { note: "handoff_human stub" } };
}