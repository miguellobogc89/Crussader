// lib/ai.ts
import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!, // asegúrate de tenerlo en .env
});
