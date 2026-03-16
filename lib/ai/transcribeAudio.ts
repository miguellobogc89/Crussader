// lib/ai/transcribeAudio.ts
import fs from "fs";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function transcribeAudio(filePath: string) {
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: "gpt-4o-mini-transcribe"
  });

  if (!transcription.text) {
    return "";
  }

  return transcription.text.trim();
}