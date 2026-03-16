// lib/crussader-assistant/intake/helpers/intakeStateMappers.ts

import type {
  IntakeMemoryState,
  IntakeReplyDecision,
  RunAssistantIntakeResult
} from "../intakeTypes";

import type { IntakeCapabilityKey } from "../intakeCatalog";

function asText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

export function buildEmptyMemoryState(): IntakeMemoryState {
  return {
    pendingTask: null,
    context: {
      lastAssistantMessage: null,
      lastUserMessages: [],
      conversationIntentData: {}
    }
  };
}

export function mapPendingIntentToPendingTask(
  pendingIntent: any
): IntakeMemoryState["pendingTask"] {
  if (!pendingIntent || typeof pendingIntent !== "object") {
    return null;
  }

  const requestedInstruction = asText(pendingIntent.requestedInstruction);
  const product = asText(pendingIntent.product);

  const collectedData =
    pendingIntent.collectedData &&
    typeof pendingIntent.collectedData === "object" &&
    !Array.isArray(pendingIntent.collectedData)
      ? pendingIntent.collectedData
      : {};

  const missingFields = Array.isArray(pendingIntent.missingFields)
    ? pendingIntent.missingFields.filter((item: unknown) => typeof item === "string")
    : [];

  const status: "READY" | "COLLECTING" =
    pendingIntent.status === "READY" ? "READY" : "COLLECTING";

  let capability: IntakeCapabilityKey | null = null;
  let userGoal: string | null = null;

  if (requestedInstruction === "CREATE_EVENT" || product === "EVENT") {
    capability = "CREATE_EVENT";

    const eventName = asText(collectedData.eventName);
    const description = asText(collectedData.description);

    if (eventName) {
      userGoal = eventName;
    } else if (description) {
      userGoal = description;
    }
  }

  if (
    requestedInstruction === "CREATE_SUBSCRIPTION" ||
    requestedInstruction === "SUBSCRIBE" ||
    product === "SUBSCRIPTION"
  ) {
    capability = "SUBSCRIBE_CONTENT";

    const contentType = asText(collectedData.contentType);
    const content = asText(collectedData.content);

    if (contentType) {
      userGoal = contentType;
    } else if (content) {
      userGoal = content;
    }
  }

  if (requestedInstruction === "QUERY_INFORMATION" || product === "INFORMATION") {
    capability = "QUERY_INFORMATION";

    const question = asText(collectedData.question);

    if (question) {
      userGoal = question;
    }
  }

  if (!capability) {
    return null;
  }

  return {
    capability,
    status,
    collectedData,
    missingFields,
    userGoal
  };
}

export function mapSessionStateToIntakeMemoryState(sessionState: any): IntakeMemoryState {
  let lastAssistantMessage: string | null = null;

  if (sessionState?.context?.lastAssistantMessage) {
    lastAssistantMessage = sessionState.context.lastAssistantMessage;
  } else if (sessionState?.context?.lastAssistantQuestion) {
    lastAssistantMessage = sessionState.context.lastAssistantQuestion;
  }

  let lastUserMessages: string[] = [];

  if (Array.isArray(sessionState?.context?.lastUserMessages)) {
    lastUserMessages = sessionState.context.lastUserMessages.filter(
      (item: unknown) => typeof item === "string"
    );
  }

  const pendingTask = mapPendingIntentToPendingTask(sessionState?.pendingIntent);

  return {
    pendingTask,
    context: {
      lastAssistantMessage,
      lastUserMessages
    }
  };
}

export function buildPreviousMessages(memoryState: IntakeMemoryState) {
  const previousMessages: Array<{
    role: "user" | "assistant";
    text: string;
  }> = [];

  if (memoryState.context.lastAssistantMessage) {
    previousMessages.push({
      role: "assistant",
      text: memoryState.context.lastAssistantMessage
    });
  }

  for (const message of memoryState.context.lastUserMessages) {
    previousMessages.push({
      role: "user",
      text: message
    });
  }

  return previousMessages;
}

export function buildReplyDecision(args: {
  rawUserText: string;
  memoryState: IntakeMemoryState;
  translated: RunAssistantIntakeResult["translatorResult"];
}): IntakeReplyDecision {
  const { rawUserText, memoryState, translated } = args;
  const pendingTask = memoryState.pendingTask;

  const enrichedMemoryState: IntakeMemoryState = {
    ...memoryState,
    context: {
      ...memoryState.context,
      conversationIntentData:
        translated.data && typeof translated.data === "object"
          ? translated.data
          : {}
    }
  };

  if (translated.interactionMode === "CONVERSATION") {
    return {
      type: "CONVERSATION",
      userMessage: rawUserText,
      rewrittenUserText: translated.rewrittenUserText,
      memoryState: enrichedMemoryState
    };
  }

  if (pendingTask && pendingTask.status === "READY") {
    return {
      type: "TASK_READY",
      capability: pendingTask.capability,
      collectedData: pendingTask.collectedData,
      userGoal: pendingTask.userGoal,
      memoryState: enrichedMemoryState
    };
  }

  if (pendingTask && pendingTask.status === "COLLECTING") {
    return {
      type: "ASK_FOR_MISSING_FIELDS",
      capability: pendingTask.capability,
      collectedData: pendingTask.collectedData,
      missingFields: pendingTask.missingFields,
      userGoal: pendingTask.userGoal,
      memoryState: enrichedMemoryState
    };
  }

  if (translated.interactionMode === "UNCLEAR") {
    return {
      type: "UNCLEAR",
      userMessage: rawUserText,
      rewrittenUserText: translated.rewrittenUserText,
      memoryState: enrichedMemoryState
    };
  }

  return {
    type: "CONVERSATION",
    userMessage: rawUserText,
    rewrittenUserText: translated.rewrittenUserText,
    memoryState: enrichedMemoryState
  };
}
