// lib/crussader-assistant/chat/buildAssistantChatReply.ts

import { openai } from "@/lib/ai";
import {
  getAssistantSessionMemory,
  updateAssistantSessionMemory,
} from "@/lib/crussader-assistant/memory/sessionMemory";

import { baseSystemPrompt } from "./prompts/baseSystemPrompt";
import { buildMemoryBlock } from "./prompts/buildMemoryBlock";

import { toolDefinitions } from "./tools/toolDefinitions";
import { executeToolCall } from "./tools/executeToolCall";
import { buildPostToolReply } from "./followups/buildPostToolReply";

type ChatReplyArgs = {
  sessionId: string;
  userText: string;
  companyId: string;
  agentId: string;
  customerId: string;
};

export type BuildAssistantChatReplyResult = {
  botText: string;
  internal?: {
    kind: "EVENT_UPSERT";
    action: "CREATED" | "UPDATED";
    eventId: string;
  } | null;
};

export async function buildAssistantChatReply(
  args: ChatReplyArgs
): Promise<BuildAssistantChatReplyResult> {
  const memory = await getAssistantSessionMemory(args.sessionId);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    messages: [
      { role: "system", content: baseSystemPrompt },
      { role: "system", content: buildMemoryBlock(memory) },
      { role: "user", content: args.userText },
    ],
    tools: toolDefinitions,
    tool_choice: "auto",
    max_tokens: 220,
  });

  const choice = completion.choices?.[0];

  if (choice?.finish_reason === "tool_calls") {
    const result = await executeToolCall({
      choice,
      args: {
        sessionId: args.sessionId,
        companyId: args.companyId,
        agentId: args.agentId,
        customerId: args.customerId,
      },
    });

    if (!result) {
      return {
        botText: "OK",
        internal: null,
      };
    }

    const followup = await buildPostToolReply({
      userText: args.userText,
      memory,
      toolResult: result,
    });

    if (!memory.state.introduced) {
      await updateAssistantSessionMemory({
        sessionId: args.sessionId,
        bucket: "state",
        patch: {
          introduced: true,
        },
      });
    }

    return {
      botText: followup.botText,
      internal: followup.internal ?? null,
    };
  }

  const botText = String(choice?.message?.content || "OK").trim();

  if (!memory.state.introduced) {
    await updateAssistantSessionMemory({
      sessionId: args.sessionId,
      bucket: "state",
      patch: {
        introduced: true,
      },
    });
  }

  return {
    botText,
    internal: null,
  };
}