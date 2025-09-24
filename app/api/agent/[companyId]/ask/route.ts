import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Cfg = {
  agentPrompt?: string;   // prompt de “persona” por empresa
  openaiModel?: string;   // opcional, p.ej. "gpt-4o-mini"
};

export async function POST(
  req: Request,
  { params }: { params: { companyId: string } }
) {
  try {
    const { companyId } = params;

    // 1) Auth por API key (como el resto de endpoints de agente)
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${process.env.CALENDAR_API_KEY}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // 2) Payload del agente
    const { question, meta, blocks, slots } = await req.json();

    // 3) Cargar prompt por empresa (ResponseSettings.config en tu schema)
    const settings = await prisma.responseSettings.findUnique({
      where: { companyId },
      select: { config: true },
    });

    const cfg = (settings?.config as Cfg) ?? {};
    const model = cfg.openaiModel || "gpt-4o-mini";

    // Prompt por empresa (si no hay, usamos uno por defecto decente)
    const companyPrompt =
      cfg.agentPrompt ??
      `Eres una recepcionista joven, amable y profesional de la clínica. 
Responde en español con naturalidad. Evita sonar a IA y no uses muletillas tipo “según mis datos”.
Sé breve y resolutiva: ofrece opciones claras o pregunta por preferencia (mañana/tarde/hora).`;

    // 4) Construir mensajes (el backend guarda la clave de OpenAI)
    const systemCore = `
No inventes horarios. La disponibilidad viene YA calculada por el sistema:
- FREE_BLOCKS = tramos largos libres (p.ej., “10:00–12:30”)
- FREE_SLOTS  = horas puntuales sugeribles (p.ej., “12:30, 12:45, 13:00”)
Usa el estilo del prompt de la empresa. No menciones términos técnicos (“bloques”, “slots”, “contexto”).
No confirmes reservas sin que el cliente elija una hora.
`.trim();

    // Serializamos datos calculados (para que el modelo solo redacte)
    const FREE_BLOCKS = (blocks || [])
      .map((b: any) => `${b.human ?? ""}`.trim())
      .filter(Boolean)
      .join(", ");
    const FREE_SLOTS = (slots || [])
      .slice(0, 6)
      .map((s: any) => s.startLocal)
      .join(", ");

    const messages = [
      { role: "system", content: companyPrompt },
      { role: "system", content: systemCore },
      { role: "system", content: `META: ${JSON.stringify(meta ?? {})}` },
      { role: "system", content: `FREE_BLOCKS: ${FREE_BLOCKS || "(sin tramos largos)"}` },
      { role: "system", content: `FREE_SLOTS: ${FREE_SLOTS || "(sin slots)"}` },

      // 2 micro-ejemplos para anclar tono
      {
        role: "system",
        content:
          "EJEMPLO 1 (muchos huecos): 'Hoy tenemos margen por la mañana en Clínica HiperDental Centro para Limpieza Dental. ¿Te viene bien entre las 10:00 y las 13:00, o prefieres que te proponga una hora concreta?'",
      },
      {
        role: "system",
        content:
          "EJEMPLO 2 (pocos huecos): 'Puedo darte a las 12:30 o 12:45 para Limpieza Dental en Clínica HiperDental Centro. ¿Cuál te encaja?'",
      },

      { role: "user", content: question ?? "" },
    ];

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, // 🔒 queda en backend
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages, temperature: 0.4 }),
    });

    if (!res.ok) {
      const txt = await res.text();
      return NextResponse.json({ ok: false, error: txt }, { status: 500 });
    }

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || "";

    return NextResponse.json({ ok: true, reply });
  } catch (err: any) {
    console.error("[agent.ask] error", err);
    return NextResponse.json({ ok: false, error: err?.message || "Internal error" }, { status: 500 });
  }
}
