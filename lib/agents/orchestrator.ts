// lib/agents/whatsapp/orchestrator.ts

export type MessageKind =
  | "greeting"
  | "smalltalk"
  | "intent" // el usuario pide algo real (cita, precio, dolor, tratamiento, etc.)
  | "unknown";

export type ConversationFlags = {
  // Estado persistido (BBDD) o derivado
  customerId: string | null;
  customerName: string | null;

  perceivedNeed: string | null;

  awaitingName: boolean;
  awaitingNeed: boolean;
};

export type OrchestratorContext = {
  // Turno actual
  userText: string;
  messageKind: MessageKind;

  // Flags actuales de la conversación (desde DB)
  flags: ConversationFlags;

  // Si quieres: señal de “este turno ya viene de un paso del flow”
  // (opcional, por si haces “locks”)
  lastBotAsked?: "need" | "name" | null;
};

export type OrchestratorMode =
  | "FREE_CHAT"
  | "COLLECT_NEED"
  | "COLLECT_NAME"
  | "PLAN_ACTIONS";

export type OrchestratorCall =
  | "ENSURE_CUSTOMER" // lookup/crear customer si aplica
  | "DETECT_NEED" // set perceivedNeed si aplica
  | "PLAN" // LLM estructurado para actions
  | "CHAT"; // LLM libre (texto)

export type OrchestratorDecision = {
  mode: OrchestratorMode;

  // Orden estricto de llamadas que debe ejecutar el route
  calls: OrchestratorCall[];

  // Reglas para tu ejecutor (route)
  constraints: {
    // si true, NO ejecutar tools/actions en este turno
    noActions: boolean;

    // si true, responder en modo “texto libre” (chat) aunque falten cosas
    allowFreeChat: boolean;

    // si true, en este turno el objetivo es recolectar 1 dato mínimo
    collect: "need" | "name" | null;
  };

  debug: {
    reason: string;
  };
};

function cleanText(s: string): string {
  return String(s || "").replace(/\s+/g, " ").trim();
}

function hasNeed(flags: ConversationFlags): boolean {
  return !!cleanText(flags.perceivedNeed || "");
}

function hasCustomer(flags: ConversationFlags): boolean {
  return !!flags.customerId;
}

/**
 * Router determinista del turno.
 * OJO: no genera texto; solo decide "qué hacer" y "qué llamar".
 */
export function decideWhatsappFlow(ctx: OrchestratorContext): OrchestratorDecision {
  const text = cleanText(ctx.userText);
  const kind = ctx.messageKind;
  const flags = ctx.flags;

  // 0) si no hay texto real -> free chat (o ignora)
  if (!text) {
    return {
      mode: "FREE_CHAT",
      calls: ["CHAT"],
      constraints: { noActions: true, allowFreeChat: true, collect: null },
      debug: { reason: "empty_text" },
    };
  }

  // 1) Siempre intentamos enriquecer customer en background si no existe.
  //    Esto NO debería bloquear conversación (no obligamos a pedir nombre).
  const shouldEnsureCustomer = !hasCustomer(flags);

  // 2) Si el usuario está saludando / smalltalk y no hay intención,
  //    dejamos conversación libre. Aun así podemos intentar ENSURE_CUSTOMER.
  if (kind === "greeting" || kind === "smalltalk" || kind === "unknown") {
    // Si el bot preguntó explícitamente need o name en el turno anterior,
    // entonces sí estamos en modo recolección aunque el mensaje sea corto.
    if (ctx.lastBotAsked === "need" && !hasNeed(flags)) {
      return {
        mode: "COLLECT_NEED",
        calls: ["DETECT_NEED", "PLAN"], // PLAN para que la IA formule la pregunta/confirmación (sin hardcode)
        constraints: { noActions: true, allowFreeChat: false, collect: "need" },
        debug: { reason: "following_up_need" },
      };
    }

    if (ctx.lastBotAsked === "name" && !hasCustomer(flags)) {
      return {
        mode: "COLLECT_NAME",
        calls: ["ENSURE_CUSTOMER", "PLAN"],
        constraints: { noActions: true, allowFreeChat: false, collect: "name" },
        debug: { reason: "following_up_name" },
      };
    }

    const calls: OrchestratorCall[] = [];
    if (shouldEnsureCustomer) calls.push("ENSURE_CUSTOMER");
    calls.push("CHAT");

    return {
      mode: "FREE_CHAT",
      calls,
      constraints: { noActions: true, allowFreeChat: true, collect: null },
      debug: { reason: "free_chat_non_intent" },
    };
  }

  // 3) kind === "intent": aquí sí entramos en el flow.
  //    Primero intentamos capturar NEED si falta.
  if (!hasNeed(flags)) {
    const calls: OrchestratorCall[] = ["DETECT_NEED", "PLAN"];
    // Podemos también asegurar customer en paralelo si no existe
    if (shouldEnsureCustomer) calls.unshift("ENSURE_CUSTOMER");

    return {
      mode: "COLLECT_NEED",
      calls,
      constraints: { noActions: true, allowFreeChat: false, collect: "need" },
      debug: { reason: "intent_missing_need" },
    };
  }

  // 4) Ya hay NEED. Si falta customer, pedimos/creamos.
  if (!hasCustomer(flags)) {
    return {
      mode: "COLLECT_NAME",
      calls: ["ENSURE_CUSTOMER", "PLAN"],
      constraints: { noActions: true, allowFreeChat: false, collect: "name" },
      debug: { reason: "intent_missing_customer" },
    };
  }

  // 5) READY: ya hay need + customer -> se puede planear acciones.
  return {
    mode: "PLAN_ACTIONS",
    calls: ["PLAN"],
    constraints: { noActions: false, allowFreeChat: false, collect: null },
    debug: { reason: "ready_for_actions" },
  };
}