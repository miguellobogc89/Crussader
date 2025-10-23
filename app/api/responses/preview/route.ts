import { NextResponse } from "next/server";
import { getPromptPreview } from "@/lib/ai/responseEngine";
import { OpenAI } from "openai";

export const dynamic = "force-dynamic";

// Asegúrate de tener la API Key en .env.local
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const settings = body?.settings ?? {};
    const review = body?.review ?? {};

    const content = (review?.content ?? "").toString().trim();
    if (!content) {
      return NextResponse.json(
        { ok: false, error: "missing_review_content" },
        { status: 400 }
      );
    }

    const {
      system,
      user,
      model,
      temperature,
      targetChars,
      applied,
    } = getPromptPreview({
      settings,
      review: { content, ...review },
    });

    // 🔮 OpenAI Chat Completion
    const completion = await openai.chat.completions.create({
      model,
      temperature,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    const fullResponse = completion.choices?.[0]?.message?.content?.trim() || "";

    // ✂️ Truncado si excede
    const trimmed =
      targetChars && fullResponse.length > targetChars
        ? fullResponse.slice(0, Math.max(0, targetChars - 1)) + "…"
        : fullResponse;

    // ✅ Devolver con bloque de depuración
    return NextResponse.json({
      ok: true,
      system,
      user,
      result: trimmed,
      full: fullResponse,
      model,
      temperature,
      targetChars,
      applied,
      debug: {
        settings,
        review,
      },
    });
  } catch (e: any) {
    console.error("Error in /api/responses/preview:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "preview_failed" },
      { status: 500 }
    );
  }
}
