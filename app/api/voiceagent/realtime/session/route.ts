// app/api/voiceagent/realtime/session/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY on server" },
        { status: 500 }
      );
    }

    // Lee overrides opcionales
    const { model, voice, instructions, temperature } = await req.json().catch(() => ({}));

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

    const payload = {
      model: realtimeModel,

      // Prompt/identidad del agente (puedes sobreescribir desde el cliente)
      instructions:
        typeof instructions === "string" && instructions.trim()
          ? instructions.trim()
          : "Eres un agente de voz en español (España). Responde de forma clara, breve y educada. No inventes datos.",

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
    { error: "Use POST with optional { model, voice, instructions, temperature >= 0.6 }" },
    { status: 405 }
  );
}
