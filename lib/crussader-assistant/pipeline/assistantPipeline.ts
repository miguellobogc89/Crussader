// lib/crussader-assistant/pipeline/assistantPipeline.ts

import {
  getAssistantConversationState,
  setAssistantConversationPendingIntent
} from "../memory/assistantSessionMemory";
import { generateReplyFromDecision } from "../reply/generateReplyFromDecision";
import { executeAssistantAction } from "../domains/events/actions/executeAssistantAction";
import { createAssistantInteractionLog } from "../logs/createAssistantInteractionLog";
import { handleEventRequest } from "../actions/events";
import { resolveInformationIntent } from "../domains/information/resolveInformationIntent";
import {
  buildEventOrchestratorRequest,
  buildLogDescription,
  buildLogTitle,
  getEventResultMessage,
  isConversationalIntent
} from "../pipeline/helpers/assistantPipelineHelpers";

type AssistantPipelineInput = {
  companyId: string;
  agentId: string;
  conversationId: string;
  caller: string;
  callee: string;
  incomingText: string;
  environment: string;
  language?: string;
  customerId?: string;
};

type PipelineResult = {
  botText: string;
};

export async function assistantPipeline(
  input: AssistantPipelineInput
): Promise<PipelineResult> {
  const conversationId = String(input.conversationId || "").trim();

  const state = await getAssistantConversationState(conversationId);
  const pendingIntent = state.pendingIntent;
  const lastAssistantQuestion = state.context.lastAssistantQuestion;

  if (!pendingIntent) {
    const botText = await generateReplyFromDecision({
      type: "FALLBACK",
      reason: "NO_PENDING_INTENT",
      lastAssistantQuestion
    });

    return { botText };
  }

  const status = pendingIntent.status;
  const collectedData = pendingIntent.collectedData || {};
  let missingFields: string[] = [];

  if (Array.isArray(pendingIntent.missingFields)) {
    missingFields = pendingIntent.missingFields;
  }

  if (status === "WAITING_FOR_DATA") {
    const botText = await generateReplyFromDecision({
      type: "ASK_FOR_MISSING_FIELDS",
      requestedInstruction: pendingIntent.requestedInstruction,
      action: pendingIntent.action,
      product: pendingIntent.product,
      subtype: pendingIntent.subtype,
      collectedData,
      missingFields,
      lastAssistantQuestion
    });

    return { botText };
  }

  if (status === "READY") {
    const informationResult = await resolveInformationIntent({
      pendingIntent: {
        requestedInstruction: pendingIntent.requestedInstruction,
        action: pendingIntent.action,
        product: pendingIntent.product,
        subtype: pendingIntent.subtype,
        collectedData
      },
      language: input.language
    });

    if (informationResult.handled) {
      await setAssistantConversationPendingIntent({
        conversationId,
        pendingIntent: null
      });

      if (informationResult.ok) {
        await createAssistantInteractionLog({
          conversationId,
          customerId: input.customerId || null,
          requestedInstruction: pendingIntent.requestedInstruction,
          action: pendingIntent.action,
          product: pendingIntent.product,
          subtype: pendingIntent.subtype,
          status: "COMPLETED",
          title: buildLogTitle({
            requestedInstruction: pendingIntent.requestedInstruction,
            product: pendingIntent.product,
            subtype: pendingIntent.subtype
          }),
          description: buildLogDescription({
            requestedInstruction: pendingIntent.requestedInstruction,
            product: pendingIntent.product,
            subtype: pendingIntent.subtype,
            collectedData,
            resultOk: true
          }),
          collectedData,
          resultPayload: informationResult.payload || {}
        });
      }

      return {
        botText: informationResult.botText
      };
    }

    if (
      isConversationalIntent({
        requestedInstruction: pendingIntent.requestedInstruction,
        action: pendingIntent.action,
        product: pendingIntent.product
      })
    ) {
      const botText = await generateReplyFromDecision({
        type: "FALLBACK",
        reason: "CONVERSATIONAL_INTENT",
        lastAssistantQuestion
      });

      return { botText };
    }

    let result: {
      ok: boolean;
      message?: string | null;
      payload?: Record<string, unknown>;
    };

    const eventRequest = buildEventOrchestratorRequest({
      requestedInstruction: pendingIntent.requestedInstruction,
      action: pendingIntent.action,
      product: pendingIntent.product,
      subtype: pendingIntent.subtype,
      collectedData
    });

    if (eventRequest && input.customerId) {
      const eventResult = await handleEventRequest({
        companyId: input.companyId,
        agentId: input.agentId,
        customerId: input.customerId,
        conversationId,
        request: eventRequest
      });


      if (eventResult.kind === "DONE") {
        result = {
          ok: true,
          message: getEventResultMessage(eventResult),
          payload: {
            eventResult
          }
        };
      } else {
        result = {
          ok: false,
          message: getEventResultMessage(eventResult),
          payload: {
            eventResult
          }
        };
      }
    } else {
      result = await executeAssistantAction({
        requestedInstruction: pendingIntent.requestedInstruction,
        action: pendingIntent.action,
        product: pendingIntent.product,
        subtype: pendingIntent.subtype,
        collectedData
      });
    }

    if (result.ok) {
      await createAssistantInteractionLog({
        conversationId,
        customerId: input.customerId || null,
        requestedInstruction: pendingIntent.requestedInstruction,
        action: pendingIntent.action,
        product: pendingIntent.product,
        subtype: pendingIntent.subtype,
        status: "COMPLETED",
        title: buildLogTitle({
          requestedInstruction: pendingIntent.requestedInstruction,
          product: pendingIntent.product,
          subtype: pendingIntent.subtype
        }),
        description: buildLogDescription({
          requestedInstruction: pendingIntent.requestedInstruction,
          product: pendingIntent.product,
          subtype: pendingIntent.subtype,
          collectedData,
          resultOk: true
        }),
        collectedData,
        resultPayload: result.payload || {}
      });

      await setAssistantConversationPendingIntent({
        conversationId,
        pendingIntent: null
      });
    }

    const executionMessage = String(result.message || "").trim();

    let replyType: "CONFIRM_ACTION" | "EXECUTION_ERROR";

    if (result.ok) {
      replyType = "CONFIRM_ACTION";
    } else {
      replyType = "EXECUTION_ERROR";
    }

    const botText = await generateReplyFromDecision({
      type: replyType,
      requestedInstruction: pendingIntent.requestedInstruction,
      action: pendingIntent.action,
      product: pendingIntent.product,
      subtype: pendingIntent.subtype,
      collectedData,
      executionMessage,
      executionPayload: result.payload || {},
      lastAssistantQuestion
    });

    return { botText };
  }

  const botText = await generateReplyFromDecision({
    type: "FALLBACK",
    reason: "UNKNOWN_STATE",
    lastAssistantQuestion
  });

  return { botText };
}