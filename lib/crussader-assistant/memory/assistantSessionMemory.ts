// lib/crussader-assistant/memory/assistantSessionMemory.ts
import { prisma } from "@/lib/prisma";
import {
  PendingIntent,
  SessionContext,
  SessionStateMemory
} from "./sessionMemoryTypes";

type AssistantMemory = {
  profile: Record<string, unknown>;
  state: SessionStateMemory;
};

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

function buildEmptySessionContext(): SessionContext {
  return {
    lastAssistantQuestion: null,
    lastUserMessages: []
  };
}

function buildEmptySessionState(): SessionStateMemory {
  return {
    pendingIntent: null,
    context: buildEmptySessionContext()
  };
}

function parsePendingIntent(value: unknown): PendingIntent | null {
  const obj = asObject(value);

  if (Object.keys(obj).length === 0) {
    return null;
  }

  let requestedInstruction: string | null = null;
  if (typeof obj.requestedInstruction === "string") {
    requestedInstruction = obj.requestedInstruction;
  }

  let action: string | null = null;
  if (typeof obj.action === "string") {
    action = obj.action;
  }

  let product: string | null = null;
  if (typeof obj.product === "string") {
    product = obj.product;
  }

  let subtype: string | null = null;
  if (typeof obj.subtype === "string") {
    subtype = obj.subtype;
  }

  let status: PendingIntent["status"] = "OPEN";
  if (
    obj.status === "OPEN" ||
    obj.status === "WAITING_FOR_DATA" ||
    obj.status === "READY" ||
    obj.status === "COMPLETED" ||
    obj.status === "ABANDONED"
  ) {
    status = obj.status;
  }

  const collectedData = asObject(obj.collectedData);

  let missingFields: string[] = [];
  if (Array.isArray(obj.missingFields)) {
    missingFields = obj.missingFields
      .filter((item) => typeof item === "string")
      .map((item) => String(item));
  }

  return {
    requestedInstruction,
    action,
    product,
    subtype,
    status,
    collectedData,
    missingFields
  };
}

function parseSessionContext(value: unknown): SessionContext {
  const obj = asObject(value);

  let lastAssistantQuestion: string | null = null;
  if (typeof obj.lastAssistantQuestion === "string") {
    lastAssistantQuestion = obj.lastAssistantQuestion;
  }

  let lastUserMessages: string[] = [];
  if (Array.isArray(obj.lastUserMessages)) {
    lastUserMessages = obj.lastUserMessages
      .filter((item) => typeof item === "string")
      .map((item) => String(item));
  }

  return {
    lastAssistantQuestion,
    lastUserMessages
  };
}

function parseSessionState(value: unknown): SessionStateMemory {
  const obj = asObject(value);

  return {
    pendingIntent: parsePendingIntent(obj.pendingIntent),
    context: parseSessionContext(obj.context)
  };
}

function buildAssistantMemoryFromRaw(rawMemory: unknown): AssistantMemory {
  const memory = asObject(rawMemory);
  const profile = asObject(memory.profile);

  let state = buildEmptySessionState();
  if (memory.state) {
    state = parseSessionState(memory.state);
  }

  return {
    profile,
    state
  };
}

function mergeContext(
  current: SessionContext,
  patch: Partial<SessionContext>
): SessionContext {
  const nextContext: SessionContext = {
    lastAssistantQuestion: current.lastAssistantQuestion,
    lastUserMessages: [...current.lastUserMessages]
  };

  if (patch.lastAssistantQuestion !== undefined) {
    nextContext.lastAssistantQuestion = patch.lastAssistantQuestion;
  }

  if (patch.lastUserMessages !== undefined) {
    nextContext.lastUserMessages = [...patch.lastUserMessages];
  }

  return nextContext;
}

function mergePendingIntent(
  current: PendingIntent | null,
  patch: Partial<PendingIntent> | null
): PendingIntent | null {
  if (patch === null) {
    return null;
  }

  const isFullReplacement =
    patch.requestedInstruction !== undefined ||
    patch.action !== undefined ||
    patch.product !== undefined ||
    patch.subtype !== undefined ||
    patch.status !== undefined ||
    patch.collectedData !== undefined ||
    patch.missingFields !== undefined;

  if (isFullReplacement) {
    return {
      requestedInstruction:
        patch.requestedInstruction !== undefined
          ? patch.requestedInstruction
          : null,
      action: patch.action !== undefined ? patch.action : null,
      product: patch.product !== undefined ? patch.product : null,
      subtype: patch.subtype !== undefined ? patch.subtype : null,
      status: patch.status !== undefined ? patch.status : "OPEN",
      collectedData:
        patch.collectedData !== undefined ? { ...patch.collectedData } : {},
      missingFields:
        patch.missingFields !== undefined ? [...patch.missingFields] : []
    };
  }

  if (!current) {
    return {
      requestedInstruction: null,
      action: null,
      product: null,
      subtype: null,
      status: "OPEN",
      collectedData: {},
      missingFields: []
    };
  }

  return {
    requestedInstruction: current.requestedInstruction,
    action: current.action,
    product: current.product,
    subtype: current.subtype,
    status: current.status,
    collectedData: { ...current.collectedData },
    missingFields: [...current.missingFields]
  };
}

async function getRawConversationMemory(conversationId: string) {
  const cleanConversationId = String(conversationId || "").trim();

  if (!cleanConversationId) {
    throw new Error("Missing conversationId");
  }

  const conversation = await prisma.messaging_conversation.findUnique({
    where: { id: cleanConversationId },
    select: { assistant_memory: true }
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  return {
    cleanConversationId,
    rawMemory: conversation.assistant_memory
  };
}

export async function getAssistantConversationMemory(
  conversationId: string
): Promise<AssistantMemory> {
  const { rawMemory } = await getRawConversationMemory(conversationId);
  return buildAssistantMemoryFromRaw(rawMemory);
}

export async function getAssistantConversationState(
  conversationId: string
): Promise<SessionStateMemory> {
  const memory = await getAssistantConversationMemory(conversationId);
  return memory.state;
}

export async function updateAssistantConversationState(args: {
  conversationId: string;
  patch: {
    pendingIntent?: Partial<PendingIntent> | null;
    context?: Partial<SessionContext>;
  };
}) {
  const { cleanConversationId, rawMemory } = await getRawConversationMemory(
    args.conversationId
  );

  const memory = buildAssistantMemoryFromRaw(rawMemory);

  const nextState: SessionStateMemory = {
    pendingIntent:
      args.patch.pendingIntent !== undefined
        ? mergePendingIntent(memory.state.pendingIntent, args.patch.pendingIntent)
        : memory.state.pendingIntent,
    context:
      args.patch.context !== undefined
        ? mergeContext(memory.state.context, args.patch.context)
        : memory.state.context
  };

  const nextMemory = {
    profile: memory.profile,
    state: nextState
  };

  await prisma.messaging_conversation.update({
    where: { id: cleanConversationId },
    data: {
      assistant_memory: nextMemory,
      updated_at: new Date()
    }
  });
}

export async function appendAssistantConversationUserMessage(args: {
  conversationId: string;
  message: string;
  maxItems?: number;
}) {
  const state = await getAssistantConversationState(args.conversationId);

  let maxItems = 6;

  if (typeof args.maxItems === "number" && args.maxItems > 0) {
    maxItems = Math.floor(args.maxItems);
  }

  const nextMessages = [...state.context.lastUserMessages, args.message];
  const trimmedMessages = nextMessages.slice(-maxItems);

  await updateAssistantConversationState({
    conversationId: args.conversationId,
    patch: {
      context: {
        lastUserMessages: trimmedMessages
      }
    }
  });
}

export async function setAssistantConversationLastQuestion(args: {
  conversationId: string;
  question: string | null;
}) {
  await updateAssistantConversationState({
    conversationId: args.conversationId,
    patch: {
      context: {
        lastAssistantQuestion: args.question
      }
    }
  });
}

export async function setAssistantConversationPendingIntent(args: {
  conversationId: string;
  pendingIntent: PendingIntent | null;
}) {
  await updateAssistantConversationState({
    conversationId: args.conversationId,
    patch: {
      pendingIntent: args.pendingIntent
    }
  });
}

export async function persistAssistantPendingIntent(args: {
  conversationId: string;
  requestedInstruction: string | null;
  action: string | null;
  product: string | null;
  subtype: string | null;
  data?: Record<string, unknown>;
  missingFields?: string[];
}) {
  const hasIntent =
    args.requestedInstruction || args.action || args.product || args.subtype;

  if (!hasIntent) {
    return;
  }

  const missingFields = args.missingFields ? args.missingFields : [];
  const collectedData = args.data ? args.data : {};

  let status: PendingIntent["status"] = "READY";

  if (missingFields.length > 0) {
    status = "WAITING_FOR_DATA";
  }

  await updateAssistantConversationState({
    conversationId: args.conversationId,
    patch: {
      pendingIntent: {
        requestedInstruction: args.requestedInstruction,
        action: args.action,
        product: args.product,
        subtype: args.subtype,
        status,
        collectedData,
        missingFields
      }
    }
  });
}

export async function clearAssistantConversationState(conversationId: string) {
  const { cleanConversationId, rawMemory } = await getRawConversationMemory(
    conversationId
  );

  const memory = buildAssistantMemoryFromRaw(rawMemory);

  const nextMemory = {
    profile: memory.profile,
    state: buildEmptySessionState()
  };

  await prisma.messaging_conversation.update({
    where: { id: cleanConversationId },
    data: {
      assistant_memory: nextMemory,
      updated_at: new Date()
    }
  });
}