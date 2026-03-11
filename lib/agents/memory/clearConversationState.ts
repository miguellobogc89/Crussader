// lib/agents/memory/clearConversationState.ts
import { updateSessionMemory } from "./updateSessionMemory";

export async function clearConversationState(sessionId: string) {
  await updateSessionMemory({
    sessionId,
    bucket: "state",
    patch: {
      flow: null,
      step: null,
      subReason: null,
      reason: null,
    },
  });
}