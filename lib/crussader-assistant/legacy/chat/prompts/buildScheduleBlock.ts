// lib/crussader-assistant/chat/prompts/buildScheduleBlock.ts
export function buildScheduleBlock(schedule: unknown) {
  return [
    "Schedule interpretation JSON:",
    JSON.stringify(schedule || {}, null, 2),
  ].join("\n");
}