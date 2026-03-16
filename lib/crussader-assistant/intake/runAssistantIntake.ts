// lib/crussader-assistant/intake/runAssistantIntake.ts

import {
  getAssistantConversationState,
  appendAssistantConversationUserMessage,
  setAssistantConversationLastQuestion,
  setAssistantConversationPendingIntent
} from "../memory/assistantSessionMemory";

import { getCatalogForPrompt, getCatalogSummaryText } from "../catalogs";

import { translateUserMessageForIntake } from "../legacy/bridges/translator/translateUserMessageForIntake";

import { shouldCancelPendingIntent } from "./helpers/shouldCancelPendingIntent";

import {
  isCapabilitiesQuestion,
  isGeneralInformationQuestion
} from "./helpers/runIntakeHelpers";

import { mergeIntakeMemoryState } from "../memory/mergeIntakeMemoryState";

import { buildAssistantReply } from "../reply/buildAssistantReply";

import { logConversationFact } from "../memory/logConversationFact";
import { logConversationTurn } from "../memory/logConversationTurn";
import { extractConversationFacts } from "../memory/extractConversationFacts";

import { normalizeAssistantIntent } from "./helpers/normalizeAssistantIntent";

import {
  buildEmptyMemoryState,
  mapSessionStateToIntakeMemoryState,
  buildPreviousMessages,
  buildReplyDecision
} from "./helpers/intakeStateMappers";

import { mapPendingTaskToPendingIntent } from "./helpers/normalizeIntakeData";

import type {
  IntakeMemoryState,
  RunAssistantIntakeInput,
  RunAssistantIntakeResult
} from "./intakeTypes";

export async function runAssistantIntake(
  input: RunAssistantIntakeInput
): Promise<RunAssistantIntakeResult> {

  console.log("[intake] user input:", input.rawUserText);

  let memoryState: IntakeMemoryState = buildEmptyMemoryState();

  await logConversationTurn({
    conversationId: input.conversationId,
    role: "user",
    rawText: input.rawUserText
  });

  const extractedFacts = extractConversationFacts(input.rawUserText);

  for (const fact of extractedFacts) {
    try {
      await logConversationFact({
        conversationId: input.conversationId,
        factType: fact.type,
        factText: fact.text
      });
    } catch (error) {
      console.error("[intake] log fact failed", error);
    }
  }

  try {
    const sessionState = await getAssistantConversationState(input.conversationId);
    memoryState = mapSessionStateToIntakeMemoryState(sessionState);
  } catch (error) {
    console.error("[intake] memory load failed", error);
  }

  // ===============================
  // CAPABILITY QUESTION
  // ===============================

  if (isCapabilitiesQuestion(input.rawUserText)) {

    console.log("[intake] capabilities question detected");

    const normalizedPendingIntent = normalizeAssistantIntent({
      requestedInstruction: "QUERY_INFORMATION",
      action: "ANSWER",
      product: null,
      subtype: "CAPABILITIES_LIST",
      collectedData: {
        question: input.rawUserText
      },
      missingFields: []
    });

    await setAssistantConversationPendingIntent({
      conversationId: input.conversationId,
      pendingIntent: normalizedPendingIntent
    });

    await appendAssistantConversationUserMessage({
      conversationId: input.conversationId,
      message: input.rawUserText,
      maxItems: 6
    });

    return {
      botText: "",
      replyDecision: { type: "TASK_READY" } as any,
      memoryState,
      translatorResult: {
        rewrittenUserText: input.rawUserText,
        interactionMode: "QUERY_INFORMATION",
        detectedCapability: "ANSWER_INFORMATION",
        confidence: 1,
        data: { question: input.rawUserText },
        missingFields: [],
        userGoal: "Consultar capacidades del asistente"
      } as any,
      readyTask: normalizedPendingIntent as any
    };
  }

  // ===============================
  // GENERAL INFORMATION QUESTION
  // ===============================

  if (isGeneralInformationQuestion(input.rawUserText)) {

    console.log("[intake] general information question detected");

    const normalizedPendingIntent = normalizeAssistantIntent({
      requestedInstruction: "QUERY_INFORMATION",
      action: "ANSWER",
      product: null,
      subtype: "GENERAL_INFORMATION",
      collectedData: {
        question: input.rawUserText
      },
      missingFields: []
    });

    await setAssistantConversationPendingIntent({
      conversationId: input.conversationId,
      pendingIntent: normalizedPendingIntent
    });

    await appendAssistantConversationUserMessage({
      conversationId: input.conversationId,
      message: input.rawUserText,
      maxItems: 6
    });

    return {
      botText: "",
      replyDecision: { type: "TASK_READY" } as any,
      memoryState,
      translatorResult: {
        rewrittenUserText: input.rawUserText,
        interactionMode: "QUERY_INFORMATION",
        detectedCapability: "ANSWER_INFORMATION",
        confidence: 1,
        data: { question: input.rawUserText },
        missingFields: [],
        userGoal: "Resolver una pregunta general"
      } as any,
      readyTask: normalizedPendingIntent as any
    };
  }

  // ===============================
  // TRANSLATOR
  // ===============================

  const previousMessages = buildPreviousMessages(memoryState);

  const translatorResult = await translateUserMessageForIntake({
    rawUserText: input.rawUserText,
    previousMessages,
    catalog: getCatalogForPrompt(),
    catalogSummary: getCatalogSummaryText()
  });

  console.log("[intake] translatorResult", {
    interactionMode: translatorResult.interactionMode,
    detectedCapability: translatorResult.detectedCapability,
    data: translatorResult.data
  });

  // ===============================
  // TASK CANCEL
  // ===============================

  if (translatorResult.interactionMode === "TASK_CANCEL") {

    console.log("[intake] task cancelled by user");

    const clearedMemoryState: IntakeMemoryState = {
      ...memoryState,
      pendingTask: null
    };

    const botText = "De acuerdo, lo dejamos.";

    await setAssistantConversationPendingIntent({
      conversationId: input.conversationId,
      pendingIntent: null
    });

    await logConversationTurn({
      conversationId: input.conversationId,
      role: "assistant",
      rawText: botText
    });

    try {
      await setAssistantConversationLastQuestion({
        conversationId: input.conversationId,
        question: botText
      });
    } catch (error) {
      console.error("[intake] save assistant message failed", error);
    }

    return {
      botText,
      replyDecision: {
        type: "CONVERSATION",
        userMessage: input.rawUserText,
        rewrittenUserText: translatorResult.rewrittenUserText,
        memoryState: clearedMemoryState
      },
      memoryState: clearedMemoryState,
      translatorResult,
      readyTask: null
    };
  }

  // ===============================
  // CANCEL VIA LEGACY DETECTOR
  // ===============================

  if (
    memoryState.pendingTask &&
    shouldCancelPendingIntent(input.rawUserText)
  ) {

    console.log("[intake] pending task cancelled");

    await setAssistantConversationPendingIntent({
      conversationId: input.conversationId,
      pendingIntent: null
    });

    const botText = "De acuerdo, lo dejo cancelado.";

    await logConversationTurn({
      conversationId: input.conversationId,
      role: "assistant",
      rawText: botText
    });

    await setAssistantConversationLastQuestion({
      conversationId: input.conversationId,
      question: botText
    });

    return {
      botText,
      replyDecision: {
        type: "CONVERSATION",
        userMessage: input.rawUserText,
        rewrittenUserText: input.rawUserText,
        memoryState
      },
      memoryState: {
        ...memoryState,
        pendingTask: null
      },
      translatorResult,
      readyTask: null
    };
  }

  // ===============================
  // USER GOAL FACT
  // ===============================

  if (translatorResult.userGoal) {
    try {
      await logConversationFact({
        conversationId: input.conversationId,
        factType: "USER_GOAL",
        factText: translatorResult.userGoal,
        confidence: translatorResult.confidence
      });
    } catch (error) {
      console.error("[intake] log userGoal fact failed", error);
    }
  }

  // ===============================
  // MEMORY MERGE
  // ===============================

  const nextMemoryState = mergeIntakeMemoryState({
    currentState: memoryState,
    translatorResult
  });

  try {

    const rawPendingIntent = mapPendingTaskToPendingIntent(
      nextMemoryState.pendingTask
    );

    let normalizedPendingIntent = null;

    if (rawPendingIntent) {
      normalizedPendingIntent = normalizeAssistantIntent({
        requestedInstruction: rawPendingIntent.requestedInstruction,
        action: rawPendingIntent.action,
        product: rawPendingIntent.product,
        subtype: rawPendingIntent.subtype,
        collectedData: rawPendingIntent.collectedData,
        missingFields: rawPendingIntent.missingFields
      });
    }

    await setAssistantConversationPendingIntent({
      conversationId: input.conversationId,
      pendingIntent: normalizedPendingIntent
    });

  } catch (error) {
    console.error("[intake] save pending task failed", error);
  }

  try {
    await appendAssistantConversationUserMessage({
      conversationId: input.conversationId,
      message: input.rawUserText,
      maxItems: 6
    });
  } catch (error) {
    console.error("[intake] append user message failed", error);
  }

  const replyDecision = buildReplyDecision({
    rawUserText: input.rawUserText,
    memoryState: nextMemoryState,
    translated: translatorResult
  });


  let botText = "";

  if (replyDecision.type !== "TASK_READY") {

    botText = await buildAssistantReply(
      replyDecision,
      input.conversationId
    );

    await logConversationTurn({
      conversationId: input.conversationId,
      role: "assistant",
      rawText: botText
    });

    try {
      await setAssistantConversationLastQuestion({
        conversationId: input.conversationId,
        question: botText
      });
    } catch (error) {
      console.error("[intake] save assistant message failed", error);
    }
  }

  const readyTask =
    nextMemoryState.pendingTask &&
    nextMemoryState.pendingTask.status === "READY"
      ? nextMemoryState.pendingTask
      : null;

  return {
    botText,
    replyDecision,
    memoryState: nextMemoryState,
    translatorResult,
    readyTask
  };
}