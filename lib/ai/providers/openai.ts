import OpenAI from "openai";

export async function completeOpenAI({
  system,
  user,
  model = "gpt-4o-mini",
  temperature = 0.6,
  maxTokens,
}: {
  system: string;
  user: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const out = await client.chat.completions.create({
    model,
    temperature,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  return out.choices?.[0]?.message?.content?.trim() || "";
}
