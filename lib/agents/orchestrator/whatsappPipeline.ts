// lib/agents/orchestator/whatsappPipeline.tsx
import { prisma } from "@/lib/prisma";
import {
  ensureWhatsappAgentSession,
  createAgentTurn,
} from "@/lib/agents/chat/agentSessionStore";
import { hydrateSessionBoard } from "@/lib/agents/chat/sessionBoardHydrator";
import { buildFreeChatReply } from "@/lib/agents/chat/freeChatReply";
import { classifySimpleMessage } from "@/lib/agents/chat/simpleMessageClassifier";
import { conversationRouter } from "@/lib/agents/chat/conversationRouter";

import { ACTIONS } from "@/lib/agents/actions";

function asObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

async function updateSessionMemoryState(args: {
  sessionId: string;
  patch: Record<string, unknown>;
}) {
  const session = await prisma.agentSession.findUnique({
    where: { id: args.sessionId },
    select: { settings: true },
  });

  const settings = asObject(session?.settings);
  const memory = asObject(settings.memory);
  const profile = asObject(memory.profile);
  const state = asObject(memory.state);

  const nextSettings = {
    ...settings,
    memory: {
      profile,
      state: {
        ...state,
        ...args.patch,
      },
    },
  };

  await prisma.agentSession.update({
    where: { id: args.sessionId },
    data: {
      settings: nextSettings,
    },
  });
}

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
  } = args;

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

  await createAgentTurn({
    sessionId: ensured.sessionId,
    role: "USER",
    text: incomingText,
  });

  const idRes = await ACTIONS.identify_customer({
    companyId,
    phone: toPhoneE164,
  });

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

  const route = await conversationRouter({
    sessionId: ensured.sessionId,
    userText: incomingText,
  });

  const sessionAfterRoute = await prisma.agentSession.findUnique({
    where: { id: ensured.sessionId },
    select: { settings: true },
  });

  const sessionAfterRouteSettings = asObject(sessionAfterRoute?.settings);
  const sessionAfterRouteMemory = asObject(sessionAfterRouteSettings.memory);
  const sessionAfterRouteState = asObject(sessionAfterRouteMemory.state);

  let activeFlow = "";
  const activeFlowRaw = sessionAfterRouteState.flow;

  if (typeof activeFlowRaw === "string") {
    activeFlow = activeFlowRaw.trim();
  }

  let effectiveIntent = String(route.intent || "");

  if (effectiveIntent.length === 0) {
    if (activeFlow === "appointment_management") {
      effectiveIntent = "appointment_management";
    }
  }

  if (effectiveIntent !== "appointment_management") {
    if (activeFlow === "appointment_management") {
      const currentStepRaw = sessionAfterRouteState.step;
      let currentStep = "";

      if (typeof currentStepRaw === "string") {
        currentStep = currentStepRaw.trim();
      }

      if (
        currentStep === "awaiting_service" ||
        currentStep === "awaiting_service_confirmation" ||
        currentStep === "awaiting_location" ||
        currentStep === "awaiting_datetime"
      ) {
        effectiveIntent = "appointment_management";
      }
    }
  }

    if (effectiveIntent === "appointment_management") {
    await updateSessionMemoryState({
      sessionId: ensured.sessionId,
      patch: {
        reason: "appointment_management",
        flow: "appointment_management",
      },
    });
  }

  await createAgentTurn({
    sessionId: ensured.sessionId,
    role: "SYSTEM",
    text:
      "router → " +
      String(route.intent || "null") +
      " · effective=" +
      String(effectiveIntent || "null") +
      " · confidence=" +
      String(route.confidence) +
      " · clarify=" +
      String(route.needsClarification),
    payload: {
      type: "INTERNAL_ROUTER_EVENT",
      intent: route.intent,
      effectiveIntent,
      confidence: route.confidence,
      needsClarification: route.needsClarification,
      clarificationQuestion: route.clarificationQuestion,
    },
  });

  const simple = classifySimpleMessage(incomingText);

  let botText = "";
  let stage = "ROUTED_CHAT";

  if (route.needsClarification && route.clarificationQuestion) {
    if (effectiveIntent === "appointment_management") {
      const built = await buildFreeChatReply({
        sessionId: ensured.sessionId,
        userText: incomingText,
        phone: toPhoneE164,
        companyId,
      });

      botText = String(built.botText || "").trim();

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

      stage = "APPOINTMENT_FLOW";
    } else {
      botText = route.clarificationQuestion;
      stage = "ROUTER_CLARIFICATION";
    }
  } else if (effectiveIntent === "human_handoff") {
    botText =
      "De acuerdo. Voy a dejar anotado que quieres hablar con una persona del centro.";
    stage = "HUMAN_HANDOFF_MOCK";
  } else if (effectiveIntent === "complaint_intake") {
    botText =
      "Entiendo. Voy a dejar registrada tu incidencia para que el centro pueda revisarla.";
    stage = "COMPLAINT_MOCK";
  } else if (effectiveIntent === "out_of_scope") {
    botText =
      "Lo siento, no puedo ayudarte con eso. Puedo ayudarte con información del centro, gestión de citas, pasar tu caso a una persona o registrar una incidencia.";
    stage = "OUT_OF_SCOPE";
  } else if (simple.kind === "ACK" || simple.kind === "GREETING") {
    if (effectiveIntent === "appointment_management") {
      const built = await buildFreeChatReply({
        sessionId: ensured.sessionId,
        userText: incomingText,
        phone: toPhoneE164,
        companyId,
      });

      botText = String(built.botText || "").trim();

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

      stage = "APPOINTMENT_FLOW";
    } else {
      botText = simple.reply;
      stage = "SIMPLE_MESSAGE";
    }
  } else if (effectiveIntent === "appointment_management") {
    const session = await prisma.agentSession.findUnique({
      where: { id: ensured.sessionId },
      select: { settings: true },
    });

    const settings = asObject(session?.settings);
    const memory = asObject(settings.memory);
    const state = asObject(memory.state);

    let currentFlow = "";
    const currentFlowRaw = state.flow;

    if (typeof currentFlowRaw === "string") {
      currentFlow = currentFlowRaw.trim();
    }

    let currentStep = "";
    const currentStepRaw = state.step;

    if (typeof currentStepRaw === "string") {
      currentStep = currentStepRaw.trim();
    }

    if (currentFlow !== "appointment_management") {
      await updateSessionMemoryState({
        sessionId: ensured.sessionId,
        patch: {
          flow: "appointment_management",
          step: "awaiting_service",
          selectedServiceId: null,
          selectedLocationId: null,
          requestedServiceText: null,
        },
      });

      currentStep = "awaiting_service";
    }

    await createAgentTurn({
      sessionId: ensured.sessionId,
      role: "SYSTEM",
      text:
        "appointment_state → flow=appointment_management · step=" +
        String(currentStep || "null"),
      payload: {
        type: "INTERNAL_APPOINTMENT_STATE_EVENT",
        flow: "appointment_management",
        step: currentStep || null,
      },
    });

    const built = await buildFreeChatReply({
      sessionId: ensured.sessionId,
      userText: incomingText,
      phone: toPhoneE164,
      companyId,
    });

    botText = String(built.botText || "").trim();

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

    stage = "APPOINTMENT_FLOW";
  } else {
    const built = await buildFreeChatReply({
      sessionId: ensured.sessionId,
      userText: incomingText,
      phone: toPhoneE164,
      companyId,
    });

    botText = String(built.botText || "").trim();

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

    if (effectiveIntent === "information_request") {
      stage = "INFORMATION_REQUEST_MOCK";
    }
  }

  await createAgentTurn({
    sessionId: ensured.sessionId,
    role: "ASSISTANT",
    text: botText,
    payload: {
      stage,
      identifyKind: idRes.kind,
      assureKind: assureResult && assureResult.kind ? assureResult.kind : null,
      rootIntent: effectiveIntent,
      rootIntentConfidence: route.confidence,
    },
  });

  return {
    botText,
    sessionId: ensured.sessionId,
    stage,
    runtime: {
      model: "gpt-4o-mini",
      temperature: 0.2,
      settingsId: null,
      stage,
    },
    debug: {
      panelMessage,
      identify: idRes,
      assure: assureResult,
      route,
      effectiveIntent,
    },
  };
}