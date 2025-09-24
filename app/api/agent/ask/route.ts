// app/api/agent/ask/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { question, context } = await req.json();

    const systemPrompt = `
Eres una recepcionista joven y amable de una clínica. 
Responde en español, con naturalidad y educación. 
Usa el CONTEXTO para servicios, empleados y citas. 
Resume los huecos como lo haría una persona real: 
- Si hay muchos, sugiere "por la mañana / por la tarde".
- Si no hay, dilo claramente.
- Nunca inventes datos que no estén en el contexto.
`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "system", content: `CONTEXTO:\n${JSON.stringify(context)}` },
          { role: "user", content: question },
        ],
        temperature: 0.4,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ ok: false, error: text }, { status: 500 });
    }

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() ?? "";

    return NextResponse.json({ ok: true, reply });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
