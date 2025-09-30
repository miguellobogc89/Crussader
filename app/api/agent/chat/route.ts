// app/api/agent/chat/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Falta OPENAI_API_KEY" }, { status: 500 });
  }
  try {
    const body = await req.json();
    const instructions: string = body?.instructions ?? "Eres un agente útil y conciso.";
    const messages: Array<{ role: "user" | "assistant"; content: string }> =
      body?.messages ?? [];

    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        system: instructions,
        input: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!r.ok) {
      return NextResponse.json(
        { error: "OpenAI error", detail: await r.text() },
        { status: 500 }
      );
    }

    const data = await r.json();
    // Respuestas API: extraemos el texto final de forma segura
    let reply = "";
    try {
      const out = data?.output_text ?? data?.output?.[0]?.content ?? "";
      reply = Array.isArray(out) ? out.map((x: any) => x?.text ?? "").join("") : String(out);
    } catch {
      /* noop */
    }

    return NextResponse.json({ reply: reply || "…" }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Bad request", detail: String(err?.message || err) },
      { status: 400 }
    );
  }
}
