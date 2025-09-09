// lib/ai/providers/openai.ts
import OpenAI from "openai";

type Params = {
  system: string;
  user: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
};

let _client: OpenAI | null = null;
function getClient() {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("Falta OPENAI_API_KEY en el entorno");
    }
    _client = new OpenAI({
      apiKey,
      // opcional: si usas proxy/enterprise
      baseURL: process.env.OPENAI_BASE_URL || undefined,
    });
  }
  return _client;
}

async function callOpenAI({
  system,
  user,
  model,
  temperature,
  maxTokens,
}: Params): Promise<string> {
  const client = getClient();
  const res = await client.chat.completions.create({
    model: model ?? process.env.AI_MODEL ?? "gpt-4o-mini",
    temperature: temperature ?? 0.6,
    max_tokens: typeof maxTokens === "number" ? maxTokens : 256,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  return res.choices?.[0]?.message?.content ?? "";
}

function mockComplete({ system, user }: Params): string {
  // Modo demo: genera algo “aceptable” cuando no hay cuota
  const head = user.split("\n").slice(0, 2).join(" ");
  return `⚠️ Modo demo. Respuesta breve basada en: ${head.slice(0, 180)}…`;
}

/**
 * Wrapper con reintentos y fallback opcional a modo demo
 * Controlado por:
 *  - AI_MODEL (string)
 *  - AI_RETRY_ATTEMPTS (nº, default 3)
 *  - AI_RETRY_BASE_MS (ms, default 700)
 *  - AI_MOCK (1 para activar mock si falla)
 */
export async function completeOpenAI({
  system,
  user,
  model = process.env.AI_MODEL ?? "gpt-4o-mini",
  temperature = 0.6,
  maxTokens = 256,
}: Params): Promise<string> {
  const attempts = Number(process.env.AI_RETRY_ATTEMPTS ?? 3);
  const base = Number(process.env.AI_RETRY_BASE_MS ?? 700);

  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      const txt = await callOpenAI({ system, user, model, temperature, maxTokens });
      if (!txt || !txt.trim()) throw new Error("empty_completion");
      return txt.trim();
    } catch (err: any) {
      lastErr = err;
      const status = err?.status ?? err?.response?.status;
      const is429 = status === 429 || /quota|rate limit/i.test(err?.message ?? "");
      const is5xx = status >= 500 && status < 600;
      if (!(is429 || is5xx)) break;

      const delay = Math.round(base * 2 ** i + Math.random() * 300);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  if (process.env.AI_MOCK === "1") {
    return mockComplete({ system, user, model, temperature, maxTokens });
  }
  throw lastErr ?? new Error("LLM unavailable");
}
