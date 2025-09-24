// agent-openai-mock.js
// Node 18+ (tienes Node 22): usa fetch nativo. Sin imports para evitar warnings de ESM.
import "dotenv/config";
// ==== CONFIG BÁSICA ====
const BASE_URL = "http://localhost:3000";              // Tu Next en local
const API_KEY  = "secret123";                           // Debe coincidir con CALENDAR_API_KEY de .env.local
const COMPANY_ID = "cmfmxqxqx0000i5i4ph2bb3ij";        // El companyId que ya probaste
const OPENAI_MODEL = "gpt-4o-mini";                     // Modelo recomendado
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;      // <- Exporta tu clave en la terminal

// Chequeo de clave OpenAI
if (!OPENAI_API_KEY) {
  console.error("❌ Falta OPENAI_API_KEY en variables de entorno.");
  console.error("   En PowerShell, ejecuta antes de correr el script:");
  console.error('   $env:OPENAI_API_KEY="TU_CLAVE_AQUI"');
  process.exit(1);
}

// ==== HELPERS ====
function fmtHour(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", { year: "numeric", month: "2-digit", day: "2-digit" });
}

// Construye un contexto compacto con lo esencial para el LLM
function buildContextFromBootstrap(data) {
  const company = data.company?.name ?? "Empresa";
  const locations = (data.company?.locations ?? []).map((l) => ({
    id: l.id,
    title: l.title,
    services: (l.services ?? []).map((s) => ({ id: s.id, name: s.name, durationMin: s.durationMin })),
    resources: (l.resources ?? []).map((r) => ({ id: r.id, name: r.name })),
  }));

  // Citas (limitamos para no inflar prompt)
  const appts = (data.appointments ?? []).slice(0, 25).map((a) => ({
    id: a.id,
    date: fmtDate(a.startAt),
    start: fmtHour(a.startAt),
    end: fmtHour(a.endAt),
    service: a.service?.name ?? null,
    employee: a.employee?.name ?? null,
    resource: a.resource?.name ?? null,
    locationTitle: a.location?.title ?? null,
    customerName: a.customerName ?? null,
    notes: a.notes ?? null,
  }));

  const employees = (data.company?.employees ?? []).map((e) => ({
    id: e.id,
    name: e.name,
    active: !!e.active,
  }));

  return {
    company,
    locations,
    employees,
    appointments: appts,
  };
}

// ==== LECTURA DEL BOOTSTRAP ====
async function fetchBootstrap() {
  const url = `${BASE_URL}/api/agent/${COMPANY_ID}/bootstrap`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${API_KEY}` } });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} al leer bootstrap: ${body}`);
  }
  const json = await res.json();
  if (!json.ok) throw new Error(`API error: ${json.error || "unknown"}`);
  return json;
}

// ==== LLAMADA A OPENAI (REST) ====
async function askOpenAI({ question, context }) {
  // Prompt de sistema: rol claro del agente + reglas para manejar agenda
  const systemPrompt = `
Eres un asistente de agenda para una clínica dental. Debes responder en español, de forma clara y educada.
Puedes usar el CONTEXTO que te paso para informar sobre servicios, empleados y citas. 
Si el usuario pide reservar/cambiar/cancelar:
1) Primero confirma detalles (servicio, fecha, hora, profesional si aplica).
2) Propón opciones reales según el CONTEXTO (no inventes huecos; si no hay datos suficientes, pide precisión).
3) Mantén respuestas concisas, y ofrece siguiente paso claro.

Formato:
- Si das disponibilidad, muestra: "Fecha – Hora – Servicio – Profesional/Salas (si aplica) – Ubicación".
- Si pides datos, dilo explícitamente (por ejemplo: "¿Qué día te vendría bien?").
`;

  // Pasamos el contexto como mensaje del "system" + "tool" para tenerlo separado del user
  const contextMsg = `CONTEXTO:\n${JSON.stringify(context, null, 2)}`;

  const body = {
    model: OPENAI_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "system", content: contextMsg },
      { role: "user", content: question },
    ],
    temperature: 0.3,
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`OpenAI HTTP ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const msg = data?.choices?.[0]?.message?.content?.trim() || "(sin respuesta)";
  return msg;
}

// ==== FLUJO PRINCIPAL ====
async function main() {
  // 1) Pregunta simulada (lo que “diría” el cliente por teléfono)
  const question = "¿Qué huecos hay hoy para una limpieza dental en la Clínica HiperDental Centro?";

  // 2) Traer datos actualizados del backend (bootstrap)
  const bootstrap = await fetchBootstrap();

  // 3) Derivar un contexto compacto que no infle el prompt
  const context = buildContextFromBootstrap(bootstrap);

  // 4) Preguntar a OpenAI
  const reply = await askOpenAI({ question, context });

  // 5) Mostrar resultado
  console.log("\n=== PREGUNTA DEL CLIENTE ===");
  console.log(question);
  console.log("\n=== RESPUESTA DEL AGENTE IA ===");
  console.log(reply);
}

main().catch((err) => {
  console.error("❌ Error:", err.message || err);
});
