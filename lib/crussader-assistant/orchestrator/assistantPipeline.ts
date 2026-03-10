// lib/crussader-assistant/orchestrator/assistantPipeline.ts
import { prisma } from "@/lib/prisma";
import { buildAssistantChatReply } from "@/lib/crussader-assistant/chat/buildAssistantChatReply";

type AssistantPipelineArgs = {
  companyId: string;
  agentId: string;
  conversationId: string;
  caller: string;
  callee: string;
  incomingText: string;
  environment: "TEST" | "PROD";
  language: "es" | "en";
  customerId: string;
};

function asText(value: unknown) {
  return String(value || "").trim();
}

function asObject(value: unknown): Record<string, unknown> {
  if (!value) {
    return {};
  }

  if (typeof value !== "object") {
    return {};
  }

  if (Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function hasPendingSessionState(state: Record<string, unknown>) {
  const pendingAction = asText(state.pending_action);
  const currentFlow = asText(state.current_flow);

  if (pendingAction) {
    return true;
  }

  if (currentFlow) {
    return true;
  }

  return false;
}

async function ensureAssistantSession(args: {
  companyId: string;
  agentId: string;
  conversationId: string;
  caller: string;
  callee: string;
  environment: "TEST" | "PROD";
  language: "es" | "en";
}) {
  const existing = await prisma.agentSession.findFirst({
    where: {
      companyId: args.companyId,
      agentId: args.agentId,
      channel: "WHATSAPP",
      caller: args.caller,
      status: {
        in: ["INIT", "ACTIVE", "IDLE"],
      },
    },
    orderBy: {
      startedAt: "desc",
    },
    select: {
      id: true,
      settings: true,
    },
  });

  if (existing) {
    const settings = asObject(existing.settings);
    const memory = asObject(settings.memory);
    const profile = asObject(memory.profile);
    const state = asObject(memory.state);

    await prisma.agentSession.update({
      where: { id: existing.id },
      data: {
        status: "ACTIVE",
        callee: args.callee,
        environment: args.environment,
        language: args.language,
        settings: {
          ...settings,
          conversationId: args.conversationId,
          memory: {
            profile,
            state,
          },
        },
      },
    });

    return {
      sessionId: existing.id,
    };
  }

  const created = await prisma.agentSession.create({
    data: {
      agentId: args.agentId,
      companyId: args.companyId,
      channel: "WHATSAPP",
      status: "ACTIVE",
      caller: args.caller,
      callee: args.callee,
      environment: args.environment,
      language: args.language,
      settings: {
        conversationId: args.conversationId,
        memory: {
          profile: {},
          state: {},
        },
      },
    },
    select: {
      id: true,
    },
  });

  return {
    sessionId: created.id,
  };
}

async function createAssistantTurn(args: {
  sessionId: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  text: string;
  payload?: Record<string, unknown> | null;
}) {
  await prisma.agentTurn.create({
    data: {
      sessionId: args.sessionId,
      role: args.role,
      text: args.text,
      payload: args.payload ?? undefined,
    },
  });
}

async function syncAssistantSessionStatus(sessionId: string) {
  const session = await prisma.agentSession.findUnique({
    where: { id: sessionId },
    select: { settings: true },
  });

  const settings = asObject(session?.settings);
  const memory = asObject(settings.memory);
  const state = asObject(memory.state);

  const keepActive = hasPendingSessionState(state);

  if (keepActive) {
    await prisma.agentSession.update({
      where: { id: sessionId },
      data: {
        status: "ACTIVE",
      },
    });

    return "ACTIVE";
  }

  await prisma.agentSession.update({
    where: { id: sessionId },
    data: {
      status: "IDLE",
    },
  });

  return "IDLE";
}

export async function assistantPipeline(args: AssistantPipelineArgs) {
  const companyId = asText(args.companyId);
  const agentId = asText(args.agentId);
  const conversationId = asText(args.conversationId);
  const caller = asText(args.caller);
  const callee = asText(args.callee);
  const incomingText = asText(args.incomingText);
  const customerId = asText(args.customerId);

  if (!companyId) {
    throw new Error("Missing companyId");
  }

  if (!agentId) {
    throw new Error("Missing agentId");
  }

  if (!conversationId) {
    throw new Error("Missing conversationId");
  }

  if (!caller) {
    throw new Error("Missing caller");
  }

  if (!callee) {
    throw new Error("Missing callee");
  }

  if (!incomingText) {
    throw new Error("Missing incomingText");
  }

  if (!customerId) {
    throw new Error("Missing customerId");
  }

  const ensured = await ensureAssistantSession({
    companyId,
    agentId,
    conversationId,
    caller,
    callee,
    environment: args.environment,
    language: args.language,
  });

  await createAssistantTurn({
    sessionId: ensured.sessionId,
    role: "USER",
    text: incomingText,
  });

  const built = await buildAssistantChatReply({
    sessionId: ensured.sessionId,
    userText: incomingText,
    companyId,
    agentId,
    customerId,
  });

await createAssistantTurn({
  sessionId: ensured.sessionId,
  role: "ASSISTANT",
  text: built.botText,
});

if (built.internal?.kind === "EVENT_UPSERT") {
  await prisma.agentSession.update({
    where: { id: ensured.sessionId },
    data: {
      status: "IDLE",
      endedAt: new Date(),
    },
  });
}

  const sessionStatus = await syncAssistantSessionStatus(ensured.sessionId);

  return {
    sessionId: ensured.sessionId,
    botText: built.botText,
    internal: built.internal ?? null,
    sessionStatus,
  };
}