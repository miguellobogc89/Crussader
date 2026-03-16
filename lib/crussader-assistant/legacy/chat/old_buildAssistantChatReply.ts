// lib/crussader-assistant/chat/old_buildAssistantChatReply.ts
import { openai } from "@/lib/ai";
import {
  getAssistantSessionMemory,
  updateAssistantSessionMemory,
} from "@/lib/crussader-assistant/memory/sessionMemory";

import { baseSystemPrompt } from "./prompts/baseSystemPrompt";
import { buildMemoryBlock } from "./prompts/buildMemoryBlock";
import { assistantEventsPrompt } from "./prompts/assistantEventsPrompt";
import { buildScheduleBlock } from "./prompts/buildScheduleBlock";
import { interpretScheduleToJson } from "./scheduling/interpretScheduleToJson";

type ChatReplyArgs = {
  sessionId: string;
  userText: string;
  companyId: string;
  agentId: string;
  customerId: string;
  conversationId: string;
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

  let scheduleBlock = "";

  try {
    const schedule = await interpretScheduleToJson(args.userText);
    scheduleBlock = buildScheduleBlock(schedule);
  } catch (error) {
    console.error("[buildAssistantChatReply] schedule parse error", error);
  }

  const messages: Array<{ role: "system" | "user"; content: string }> = [
    { role: "system", content: baseSystemPrompt },
    { role: "system", content: assistantEventsPrompt },
    { role: "system", content: buildMemoryBlock(memory) },
  ];

  if (scheduleBlock) {
    messages.push({
      role: "system",
      content: scheduleBlock,
    });
  }

  messages.push({
    role: "user",
    content: args.userText,
  });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    messages,
    max_tokens: 220,
  });

  const choice = completion.choices?.[0];

  console.log("[buildAssistantChatReply] finish_reason", choice?.finish_reason);
  console.log(
    "[buildAssistantChatReply] content",
    String(choice?.message?.content || "")
  );

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