// lib/crussader-assistant/chat/prompts/buildMemoryBlock.ts

export function buildMemoryBlock(memory: {
  profile: Record<string, unknown>;
  state: Record<string, unknown>;
}) {

  return [
    "Session memory:",
    JSON.stringify(
      {
        profile: memory.profile || {},
        state: memory.state || {},
      },
      null,
      2
    ),
  ].join("\n");

}