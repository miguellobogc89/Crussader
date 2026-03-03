import {
  ensureWhatsappAgentSession,
  createAgentTurn,
} from "@/lib/agents/chat/agentSessionStore";
import { hydrateSessionBoard } from "@/lib/agents/chat/sessionBoardHydrator";
import { buildFreeChatReply } from "@/lib/agents/chat/freeChatReply";

import { ACTIONS } from "@/lib/agents/actions";

export async function whatsappPipeline(args: {
  companyId: string;
  agentId: string;
  conversationId: string;
  toPhoneE164: string;
  phoneNumberId: string;
  incomingText: string;
  environment: "TEST" | "PROD";
  language: "es" | "en";
  contactName: string | null;
  installationId: string;
}) {
  const {
    companyId,
    agentId,
    conversationId,
    toPhoneE164,
    phoneNumberId,
    incomingText,
    environment,
    language,
    installationId,
  } = args;

  // 1) Sesión + board base
  const ensured = await ensureWhatsappAgentSession({
    agentId,
    companyId,
    conversationId,
    caller: toPhoneE164,
    callee: phoneNumberId,
    environment,
    language,
  });

  await hydrateSessionBoard({ sessionId: ensured.sessionId, companyId });

  // 2) Turno USER
  await createAgentTurn({
    sessionId: ensured.sessionId,
    role: "USER",
    text: incomingText,
  });

  // 3) Identify (solo lectura)
  const idRes = await ACTIONS.identify_customer({
    companyId,
    phone: toPhoneE164,
  });

  // 4) Mensaje interno (panel/log), NO se envía al cliente
  let panelMessage = "Se ha llamado bien a la función identificar cliente: ";
  let assureResult: any = null;

  if (idRes.kind === "NONE") {
    assureResult = await ACTIONS.assure_customer({
      phone: toPhoneE164,
      agentId,
      sessionId: ensured.sessionId,
    });

    panelMessage +=
      "cliente no existe en bbdd, por lo tanto se ha llamado a la función assureCustomer y se ha creado el cliente como 'Unknown'.";
  } else if (idRes.kind === "GLOBAL_ONLY") {
    panelMessage +=
      "cliente existe en bbdd pero no esta relacionado con la company.";
  } else {
    panelMessage +=
      "cliente conocido (existe y esta relacionado con la company).";
  }

  // Evento interno para panel (NO visible al cliente)
  await createAgentTurn({
    sessionId: ensured.sessionId,
    role: "SYSTEM",
    text: panelMessage,
    payload: {
      type: "INTERNAL_CUSTOMER_EVENT",
      identifyKind: idRes.kind,
      assureKind: assureResult && assureResult.kind ? assureResult.kind : null,
    },
  });

  // 7) Respuesta al cliente (IA conversacional / tool-calling)
  const built = await buildFreeChatReply({
    sessionId: ensured.sessionId,
    userText: incomingText,
    phone: toPhoneE164,
    companyId,
  });

  const botText = String(built.botText || "").trim();

  // ✅ Nuevo: evento interno si hubo upsert de datos (via tools)
  if (built.internal && built.internal.kind === "CUSTOMER_UPSERT") {
    await createAgentTurn({
      sessionId: ensured.sessionId,
      role: "SYSTEM",
      text: "customer_data_upsert → " + String(built.internal.message || ""),
      payload: {
        type: "INTERNAL_CUSTOMER_UPSERT_EVENT",
        changes: Array.isArray(built.internal.changes)
          ? built.internal.changes
          : [],
        customerId: String(built.internal.customerId || ""),
      },
    });
  }

  // 8) Turno ASSISTANT (lo que ve el cliente)
  await createAgentTurn({
    sessionId: ensured.sessionId,
    role: "ASSISTANT",
    text: botText,
    payload: {
      stage: "CHAT_ONLY",
      identifyKind: idRes.kind,
      assureKind: assureResult && assureResult.kind ? assureResult.kind : null,
    },
  });

  // 9) Return al route
  return {
    botText,
    sessionId: ensured.sessionId,
    stage: "CHAT_ONLY",
    runtime: {
      model: "gpt-4o-mini",
      temperature: 0.2,
      settingsId: null,
      stage: "CHAT_ONLY",
    },
    debug: {
      panelMessage,
      identify: idRes,
      assure: assureResult,
    },
  };
}