// agent-settings.js
import { config as dotenvConfig } from "dotenv";
dotenvConfig({ path: ".env.local" });
if (!process.env.OPENAI_API_KEY || !process.env.CALENDAR_API_KEY) dotenvConfig();

const BASE_URL = process.env.AGENT_BASE_URL || "http://localhost:3000";
const API_KEY = process.env.CALENDAR_API_KEY;

const DEFAULTS = {
  llm: { model: "gpt-4o-mini", temperature: 0.3, maxTokens: 350 },
  style: { language: "es", persona: "Recepcionista cercana, clara y profesional.", suggestMaxSlots: 3, closingQuestion: true },
  nlu: { services: {}, actions: {} },
  flow: {
    identify: { system: "", assistantPrompt: "¿Nombre y apellidos, por favor?" },
    intent: { system: "", assistantPrompt: "¿En qué puedo ayudarte?" },
    servicePipelines: {},
    fallback: { firstRetry: "¿Higiene, Revisión u otra cosa?", secondRetry: "Dejo nota para que te llamemos." }
  }
};

function deepMerge(a, b) {
  if (Array.isArray(a) || Array.isArray(b) || typeof a !== "object" || typeof b !== "object") return b ?? a;
  const out = { ...a };
  for (const k of Object.keys(b || {})) out[k] = deepMerge(a[k], b[k]);
  return out;
}

async function fetchBootstrap(companyId) {
  const url = `${BASE_URL}/api/agent/${companyId}/bootstrap`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${API_KEY}` } });
  const json = await res.json();
  if (!res.ok || !json?.ok) throw new Error(json?.error || `HTTP ${res.status}`);
  return json;
}

export async function getAgentSettings(companyId) {
  const boot = await fetchBootstrap(companyId);
  // si ya guardas agentSettings en company, úsalo. Si no, intenta leer fichero local (opcional)
  const raw = boot.company?.agentSettings || null;
  const settings = deepMerge(DEFAULTS, raw || {});
  return { settings, bootstrap: boot };
}
