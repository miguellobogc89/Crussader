// app/api/voiceagent/realtime/session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Resuelve companyId: prioriza el del body; si no, lo obtiene desde agentId */
async function resolveCompanyId(input: { companyId?: string; agentId?: string }) {
  if (input.companyId && String(input.companyId).trim()) return String(input.companyId).trim();
  if (!input.agentId) return null;
  const a = await prisma.agent.findUnique({
    where: { id: String(input.agentId) },
    select: { companyId: true },
  });
  return a?.companyId ?? null;
}

/** Devuelve bloque de conocimiento (secciones PUBLIC) como texto Markdown listo para inyectar */
async function buildCompanyKnowledgeBlock(companyId: string) {
  if (!companyId) return "";
  const sections = await prisma.knowledgeSection.findMany({
    where: { companyId, visibility: "PUBLIC", isActive: true },
    orderBy: { position: "asc" },
    select: { title: true, content: true },
  });

  if (!sections.length) return "";

  const text = sections
    .map((s, i) => {
      const title = (s.title ?? "Sección").trim();
      const content = (s.content ?? "").trim();
      return `### ${i + 1}. ${title}\n${content}`;
    })
    .join("\n\n");

  const header = [
    "### Conocimiento de la empresa",
    "Usa SOLO esta información para responder sobre horarios, dirección, servicios, tarifas y políticas.",
    "Si falta un dato, dilo claramente y ofrece gestionar una cita o que la clínica contacte.",
    "",
  ].join("\n");

  return header + text;
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY on server" },
        { status: 500 }
      );
    }

    // Lee overrides opcionales
    const {
      model,
      voice,
      instructions,
      temperature,
      companyId: rawCompanyId,
      agentId,
    } = (await req.json().catch(() => ({}))) as {
      model?: string;
      voice?: string;
      instructions?: string;
      temperature?: number;
      companyId?: string;
      agentId?: string;
    };

    // 1) Resolver companyId (si viene en el body, manda; si no, desde agentId)
    const companyId = await resolveCompanyId({ companyId: rawCompanyId, agentId });

    // 2) Construir bloque de conocimiento (opcional)
    const knowledgeBlock = companyId
      ? await buildCompanyKnowledgeBlock(companyId)
      : "";

    const realtimeModel =
      typeof model === "string" && model.trim()
        ? model.trim()
        : "gpt-4o-realtime-preview";

    const selectedVoice =
      typeof voice === "string" && voice.trim() ? voice.trim() : "alloy";

    // El modelo requiere >= 0.6
    const temp =
      typeof temperature === "number" && !Number.isNaN(temperature)
        ? Math.max(0.6, temperature)
        : 0.7;

    // 3) Instrucciones base + knowledge opcional
    const baseInstructions =
      typeof instructions === "string" && instructions.trim()
        ? instructions.trim()
        : "Eres un agente de voz en español (España). Responde de forma clara, breve y educada. No inventes datos.";
    const finalInstructions = knowledgeBlock
      ? `${baseInstructions}\n\n${knowledgeBlock}`
      : baseInstructions;

    const payload = {
      model: realtimeModel,

      // Prompt/identidad del agente (ahora con Knowledge si existe)
      instructions: finalInstructions,

      // Detección de turnos (silencio ~600ms)
      turn_detection: { type: "server_vad", silence_duration_ms: 600 },

      // Transcripción en español con puntuación (código corto 'es')
      input_audio_transcription: {
        model: "gpt-4o-transcribe",
        language: "es",
        prompt:
          "Transcribe en español (España). Usa puntuación y mayúsculas correctas. No traduzcas.",
      },

      // Voz TTS de salida
      voice: selectedVoice,

      // Control de creatividad requerido por el modelo
      temperature: temp,
    } as const;

    const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const errText = await r.text();
      return NextResponse.json(
        { error: "Failed to create Realtime session", details: errText },
        { status: 500 }
      );
    }

    const session = await r.json();

    // Exponemos lo mínimo necesario al cliente
    return NextResponse.json(
      {
        client_secret: session?.client_secret, // { value, expires_at }
        model: session?.model ?? realtimeModel,
        expires_at: session?.client_secret?.expires_at ?? null,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      {
        error: "Unexpected error creating session",
        details: String(e?.message ?? e),
      },
      { status: 500 }
    );
  }
}

// GET solo para orientar al usuario (esta ruta se usa con POST)
export async function GET() {
  return NextResponse.json(
    {
      error:
        "Use POST with optional { model, voice, instructions, temperature >= 0.6, companyId?, agentId? }",
    },
    { status: 405 }
  );
}
