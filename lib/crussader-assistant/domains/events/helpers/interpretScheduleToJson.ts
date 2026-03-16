// lib/crussader-assistant/chat/scheduling/interpretScheduleToJson.ts
import { openai } from "@/lib/ai";
import { scheduleJsonPrompt } from "../prompts/scheduleJsonPrompt";

export async function interpretScheduleToJson(userText: string) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    messages: [
      { role: "system", content: scheduleJsonPrompt },
      { role: "user", content: userText },
    ],
    max_tokens: 700,
  });

  const content = String(completion.choices?.[0]?.message?.content || "").trim();

  try {
    return JSON.parse(content);
  } catch {
    throw new Error("Invalid schedule JSON");
  }
}