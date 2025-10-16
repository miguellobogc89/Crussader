// scripts/testTopicDescription.ts
import "dotenv/config";
import OpenAI from "openai";
import { composeTopicDescription } from "../app/server/topics/buildTopicDescriptionPrompt";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function callLLM(messages: { role: "system" | "user" | "assistant"; content: string }[]) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
  });
  return response.choices[0].message.content ?? "";
}

async function main() {
  const description = await composeTopicDescription(
    {
      topicName: "Atención telefónica",
      concepts: [
        {
          id: "c1",
          name: "Teléfono ocupado a mediodía",
          previewSnippets: [
            "No contestan entre las 13:00 y 15:00",
            "Siempre comunica al mediodía",
          ],
        },
        {
          id: "c2",
          name: "Llamadas sin respuesta",
          previewSnippets: ["Nunca atienden los sábados"],
        },
      ],
      totalReviewsInTopic: 42,
      locationName: "Ribera del Loira",
      companyName: "Endesa",
    },
    callLLM
  );

  console.log("\n=== Descripción generada ===\n");
  console.log(description);
  console.log("\n============================\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
