// lib/agents/orchestator/whatsappPipeline.tsx
import { prisma } from "@/lib/prisma";
import {
  ensureWhatsappAgentSession,
  createAgentTurn,
} from "@/lib/agents/chat/agentSessionStore";
import { hydrateSessionBoard } from "@/lib/agents/chat/sessionBoardHydrator";
import { buildFreeChatReply } from "@/lib/agents/chat/freeChatReply";
import {
  classifySimpleMessage,
  classifyAppointmentSubReason,
} from "@/lib/agents/chat/simpleMessageClassifier";
import { clearConversationState } from "@/lib/agents/memory/clearConversationState";
import { conversationRouter } from "@/lib/agents/chat/conversationRouter";
import {
  classifyConversationClosure,
  closeConversationContext,
} from "@/lib/agents/chat/conversationClosure";

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

  await prisma.agentSession.update({
    where: { id: ensured.sessionId },
    data: { status: "ACTIVE" },
  });

  await hydrateSessionBoard({ sessionId: ensured.sessionId, companyId });

 await createAgentTurn({
  sessionId: ensured.sessionId,
  role: "USER",
  text: incomingText,
});

const sessionAfterUser = await prisma.agentSession.findUnique({
  where: { id: ensured.sessionId },
  select: { settings: true },
});

const settingsAfterUser = asObject(sessionAfterUser?.settings);
const memoryAfterUser = asObject(settingsAfterUser.memory);
const stateAfterUser = asObject(memoryAfterUser.state);

let currentStepAfterUser = "";
const stepRaw = stateAfterUser.step;

if (typeof stepRaw === "string") {
  currentStepAfterUser = stepRaw.trim();
}

if (currentStepAfterUser === "awaiting_cancellation_reason") {
  const appointmentIdRaw = stateAfterUser.targetAppointmentId;
  const appointmentId =
    typeof appointmentIdRaw === "string" ? appointmentIdRaw.trim() : "";

  if (appointmentId.length > 0) {
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        cancellation_reason: incomingText,
      },
    });
  }

  await clearConversationState(ensured.sessionId);

  await prisma.agentSession.update({
    where: { id: ensured.sessionId },
    data: {
      status: "IDLE",
      endedAt: new Date(),
    },
  });

  const botText = "Gracias por indicarnos el motivo. Lo tendremos en cuenta.";

  await createAgentTurn({
    sessionId: ensured.sessionId,
    role: "ASSISTANT",
    text: botText,
    payload: {
      stage: "CANCELLATION_REASON_SAVED",
      identifyKind: null,
      assureKind: null,
      rootIntent: "appointment_management",
      rootIntentConfidence: null,
      subReason: "cancel",
    },
  });

  return {
    botText,
    sessionId: ensured.sessionId,
    stage: "CANCELLATION_REASON_SAVED",
    runtime: {
      model: "gpt-4o-mini",
      temperature: 0.2,
      settingsId: null,
      stage: "CANCELLATION_REASON_SAVED",
    },
    debug: {
      panelMessage: "cancellation reason saved",
      identify: null,
      assure: null,
      route: null,
      effectiveIntent: "appointment_management",
      effectiveSubReason: "cancel",
    },
  };
}

  const sessionBefore = await prisma.agentSession.findUnique({
    where: { id: ensured.sessionId },
    select: { settings: true },
  });

  const sessionBeforeSettings = asObject(sessionBefore?.settings);
  const sessionBeforeMemory = asObject(sessionBeforeSettings.memory);
  const sessionBeforeState = asObject(sessionBeforeMemory.state);

  const previousFlow =
    typeof sessionBeforeState.flow === "string" ? sessionBeforeState.flow.trim() : "";
  const previousSubReason =
    typeof sessionBeforeState.subReason === "string"
      ? sessionBeforeState.subReason.trim()
      : "";

  if (previousFlow.length > 0) {
    const closure = classifyConversationClosure(incomingText);

if (closure.shouldClose) {
  await closeConversationContext({
    sessionId: ensured.sessionId,
  });
  await prisma.agentSession.update({
    where: { id: ensured.sessionId },
    data: { status: "IDLE" },
  });

  await createAgentTurn({
    sessionId: ensured.sessionId,
    role: "SYSTEM",
    text:
      "conversation_closure → flow=" +
      String(previousFlow || "null") +
      " · subReason=" +
      String(previousSubReason || "null") +
      " · action=clear_state",
    payload: {
      type: "INTERNAL_CONVERSATION_CLOSURE_EVENT",
      previousFlow: previousFlow || null,
      previousSubReason: previousSubReason || null,
      action: "clear_state",
      sessionStatus: "IDLE",
    },
  });

  const built = await buildFreeChatReply({
    sessionId: ensured.sessionId,
    userText: incomingText,
    phone: toPhoneE164,
    companyId,
  });

  const closureText = String(built.botText || "").trim();

  await createAgentTurn({
    sessionId: ensured.sessionId,
    role: "ASSISTANT",
    text: closureText,
    payload: {
      stage: "CONVERSATION_CLOSED",
      identifyKind: null,
      assureKind: null,
      rootIntent: null,
      rootIntentConfidence: null,
      subReason: null,
      sessionStatus: "IDLE",
    },
  });

  return {
    botText: closureText,
    sessionId: ensured.sessionId,
    stage: "CONVERSATION_CLOSED",
    runtime: {
      model: "gpt-4o-mini",
      temperature: 0.2,
      settingsId: null,
      stage: "CONVERSATION_CLOSED",
    },
    debug: {
      panelMessage: "conversation closed",
      identify: null,
      assure: null,
      route: null,
      effectiveIntent: null,
      effectiveSubReason: null,
    },
  };
}
  }

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

  let activeStep = "";
  const activeStepRaw = sessionAfterRouteState.step;

  if (typeof activeStepRaw === "string") {
    activeStep = activeStepRaw.trim();
  }

  let currentSubReason = "";
  const currentSubReasonRaw = sessionAfterRouteState.subReason;

  if (typeof currentSubReasonRaw === "string") {
    currentSubReason = currentSubReasonRaw.trim();
  }

  let effectiveIntent = String(route.intent || "");

  if (effectiveIntent.length === 0) {
    if (activeFlow === "appointment_management") {
      effectiveIntent = "appointment_management";
    }
  }

  if (effectiveIntent !== "appointment_management") {
    if (activeFlow === "appointment_management") {
      if (
        activeStep === "awaiting_service" ||
        activeStep === "awaiting_service_confirmation" ||
        activeStep === "awaiting_location" ||
        activeStep === "awaiting_datetime"
      ) {
        effectiveIntent = "appointment_management";
      }
    }
  }

  let effectiveSubReason = currentSubReason;

  if (effectiveIntent === "appointment_management") {
    const detectedSubReason = classifyAppointmentSubReason({
      text: incomingText,
      currentStep: activeStep,
      currentSubReason,
    });

    if (detectedSubReason !== "unknown") {
      effectiveSubReason = detectedSubReason;
    }

    if (!effectiveSubReason) {
      effectiveSubReason = "unknown";
    }

    await updateSessionMemoryState({
      sessionId: ensured.sessionId,
      patch: {
        reason: "appointment_management",
        flow: "appointment_management",
        subReason: effectiveSubReason,
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
      " · subReason=" +
      String(effectiveSubReason || "null") +
      " · confidence=" +
      String(route.confidence) +
      " · clarify=" +
      String(route.needsClarification),
    payload: {
      type: "INTERNAL_ROUTER_EVENT",
      intent: route.intent,
      effectiveIntent,
      subReason: effectiveSubReason || null,
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
        String(currentStep || "null") +
        " · subReason=" +
        String(effectiveSubReason || "null"),
      payload: {
        type: "INTERNAL_APPOINTMENT_STATE_EVENT",
        flow: "appointment_management",
        step: currentStep || null,
        subReason: effectiveSubReason || null,
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
      subReason: effectiveSubReason || null,
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
      effectiveSubReason,
    },
  };
}