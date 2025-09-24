// agent-openai-mock.js — Node 22 (fetch nativo)
// Objetivo: tú calculas huecos; el LLM los resume con tono humano, sin hardcodeos.

const BASE_URL = "http://localhost:3000";
const API_KEY = "secret123"; // = CALENDAR_API_KEY
const COMPANY_ID = "cmfmxqxqx0000i5i4ph2bb3ij";
const OPENAI_MODEL = "gpt-4o-mini";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('❌ Falta OPENAI_API_KEY. PowerShell:  $env:OPENAI_API_KEY="TU_CLAVE"');
  process.exit(1);
}

// ====== TZ helpers (MVP) ======
const MADRID_OFFSET_MIN = 120; // CEST (24/09). Para prod usar lib TZ (p.ej. luxon)
function toMinutesLocal(isoUtc) {
  const d = new Date(isoUtc);
  return d.getUTCHours() * 60 + d.getUTCMinutes() + MADRID_OFFSET_MIN;
}
function fromMinutesLocalToIso(dateISO, minutesLocal) {
  const [y, m, d] = dateISO.split("-").map(Number);
  const utcBase = Date.UTC(y, m - 1, d, 0, 0, 0);
  const utcMillis = utcBase + (minutesLocal - MADRID_OFFSET_MIN) * 60 * 1000;
  return new Date(utcMillis).toISOString();
}
function fmtHourLocal(isoUtc) {
  const mins = toMinutesLocal(isoUtc);
  const h = Math.floor(mins / 60) % 24, mm = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", { year: "numeric", month: "2-digit", day: "2-digit" });
}

// ====== API ======
async function fetchBootstrap() {
  const url = `${BASE_URL}/api/agent/${COMPANY_ID}/bootstrap`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${API_KEY}` } });
  if (!res.ok) throw new Error(`HTTP ${res.status} bootstrap`);
  const json = await res.json();
  if (!json.ok) throw new Error(`API error: ${json.error || "unknown"}`);
  return json;
}

// ====== Cálculo de ocupados/libres ======
function getOccupiedBlocks(bootstrap, locationTitle, workStartMin, workEndMin) {
  const taken = (bootstrap.appointments || [])
    .filter((a) => a.location?.title === locationTitle)
    .map((a) => ({ start: toMinutesLocal(a.startAt), end: toMinutesLocal(a.endAt) }))
    .map(({ start, end }) => ({
      start: Math.max(start, workStartMin),
      end: Math.min(end, workEndMin),
    }))
    .filter((b) => b.end > b.start)
    .sort((a, b) => a.start - b.start);

  // merge
  const merged = [];
  for (const b of taken) {
    if (!merged.length || b.start > merged[merged.length - 1].end) merged.push({ ...b });
    else merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, b.end);
  }
  return merged;
}

function getFreeBlocks(occupied, workStartMin, workEndMin) {
  const free = [];
  let cur = workStartMin;
  for (const b of occupied) {
    if (b.start > cur) free.push({ start: cur, end: b.start });
    cur = Math.max(cur, b.end);
  }
  if (cur < workEndMin) free.push({ start: cur, end: workEndMin });
  return free;
}

/**
 * Devuelve:
 * - blocks: tramos libres (p.ej. 08:00–10:00, 12:30–14:00)
 * - slots: slots discretos de tamaño duración cada 15'
 */
function computeFreeSlotsAndBlocks({ bootstrap, locationTitle, serviceName }) {
  const loc = (bootstrap.company?.locations || []).find((l) => l.title === locationTitle);
  if (!loc) return { dateISO: null, durationMin: 0, blocks: [], slots: [] };
  const service = (loc.services || []).find((s) => s.name.toLowerCase() === serviceName.toLowerCase());
  if (!service) return { dateISO: null, durationMin: 0, blocks: [], slots: [] };

  const anyAppt = (bootstrap.appointments || []).find((a) => a.location?.title === locationTitle);
  const dateISO = anyAppt ? anyAppt.startAt.slice(0, 10) : new Date().toISOString().slice(0, 10);

  // Ventana de trabajo (MVP). Puedes parametrizar por location.openingHours más adelante.
  const WORK_START_MIN = 8 * 60;   // 08:00
  const WORK_END_MIN   = 20 * 60;  // 20:00
  const duration = service.durationMin || 45;

  const occupied = getOccupiedBlocks(bootstrap, locationTitle, WORK_START_MIN, WORK_END_MIN);
  const freeBlocks = getFreeBlocks(occupied, WORK_START_MIN, WORK_END_MIN);

  // slots discretos cada 15'
  const slots = [];
  const STEP = 15;
  for (const gap of freeBlocks) {
    for (let start = gap.start; start + duration <= gap.end; start += STEP) {
      const startIso = fromMinutesLocalToIso(dateISO, start);
      const endIso = fromMinutesLocalToIso(dateISO, start + duration);
      slots.push({ startIso, endIso, startLocal: fmtHourLocal(startIso), endLocal: fmtHourLocal(endIso) });
    }
  }

  return { dateISO, durationMin: duration, blocks: freeBlocks, slots: slots.slice(0, 20) };
}

function blocksToHuman(blocks, dateISO) {
  // p.ej. [{start: 480, end: 600}, ...] -> ["08:00–10:00", ...]
  return blocks.map((b) => {
    const sIso = fromMinutesLocalToIso(dateISO, b.start);
    const eIso = fromMinutesLocalToIso(dateISO, b.end);
    return `${fmtHourLocal(sIso)}–${fmtHourLocal(eIso)}`;
  });
}

// ====== OpenAI: persona humana y resumen inteligente ======
async function askOpenAI({ question, meta, blocks, slots }) {
  // FREE_BLOCKS (rangos) y FREE_SLOTS (horas puntuales) vienen ya calculados por nosotros
  // Persona: recepcionista joven, simpática, profesional; evita sonar a IA; natural y eficiente.
  const systemPrompt = `
Eres una recepcionista joven de una clínica dental. Quieres causar buena impresión: eres amable, directa y profesional.
No te presentes como IA. Evita frases tipo "según mis datos" o "como modelo de lenguaje".
Dispones de disponibilidad YA CALCULADA por el sistema (FREE_BLOCKS y FREE_SLOTS). No inventes horas.

Guía de estilo:
- Si hay tramos amplios, resúmelos en lenguaje natural (p.ej., "por la mañana tenemos bastante margen").
- Si el usuario pide "hoy/mañana" para un servicio concreto, ofrece lo más útil: 
  - O bien una frase-resumen + pregunta abierta ("¿te viene bien por la mañana?"),
  - O bien 2–3 horas concretas si es mejor (evita listas largas).
- Sé cálida y resolutiva (una frase de contexto + propuesta clara + pregunta de cierre).
- Mantén respuestas cortas. Usa tono humano y profesional. No uses emojis salvo que el usuario los use.
- No menciones "FREE_BLOCKS", "FREE_SLOTS" ni "contexto"; son detalles internos.

Formato sugerido (elige lo que aplique):
- Resumen: "Hoy, en ${meta.locationTitle}, para ${meta.serviceName}, tenemos la mañana bastante libre."
- Propuesta concreta: "Podría darte a las 12:30 o 12:45. ¿Cuál te encaja?"
- Pregunta abierta: "¿Te va bien por la mañana o prefieres tarde?"

No confirmes reservas sin que el cliente elija una hora.
`.trim();

  // Preparamos datos “internos” que el modelo usará SOLO para redactar
  const FREE_BLOCKS = blocksToHuman(blocks, meta.dateISO).join(", ") || "(sin tramos largos)";
  const FREE_SLOTS  = slots.slice(0, 6).map((s) => s.startLocal).join(", ") || "(sin slots)";

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "system", content: `META: ${JSON.stringify(meta)}` },
    { role: "system", content: `FREE_BLOCKS: ${FREE_BLOCKS}` },
    { role: "system", content: `FREE_SLOTS: ${FREE_SLOTS}` },

    // Few-shots breves para anclar el estilo:
    {
      role: "system",
      content:
        "EJEMPLO 1 (muchos huecos): 'Hoy tenemos margen por la mañana en Clínica HiperDental Centro para Limpieza Dental. ¿Te viene bien entre las 10:00 y las 13:00 o prefieres que te proponga una hora concreta?'",
    },
    {
      role: "system",
      content:
        "EJEMPLO 2 (pocos huecos): 'Puedo ofrecerte a las 12:30 o 12:45 para Limpieza Dental en Clínica HiperDental Centro. ¿Cuál prefieres?'",
    },
    { role: "user", content: question },
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: OPENAI_MODEL, messages, temperature: 0.4 }),
  });
  if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content?.trim() || "(sin respuesta)";
}

// ====== Reserva demo (si la quisieras tras confirmación del cliente) ======
async function bookFirstSlot({ slot, bootstrap }) {
  const location = (bootstrap.company.locations || []).find((l) => l.title === "Clínica HiperDental Centro");
  if (!location) throw new Error("Location no encontrada");
  const service = (location.services || []).find((s) => s.name === "Limpieza Dental");
  if (!service) throw new Error("Servicio no encontrado");

  const url = `${BASE_URL}/api/agent/${bootstrap.company.id}/appointments`;
  const payload = {
    locationId: location.id,
    serviceId: service.id,
    startAt: slot.startIso,
    customerName: "Cliente Demo",
    customerPhone: "+34600111222",
    notes: "Reserva creada por agente IA (demo)",
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Fallo al crear cita: HTTP ${res.status} ${t}`);
  }
  const json = await res.json();
  if (!json.ok) throw new Error(`API error: ${json.error || "unknown"}`);
  return json.item;
}

// ====== MAIN ======
async function main() {
  const question = "¿Qué huecos hay hoy para una limpieza dental en la Clínica HiperDental Centro?";
  const bootstrap = await fetchBootstrap();

  const anyAppt = (bootstrap.appointments || []).find((a) => a.location?.title === "Clínica HiperDental Centro");
  const dateISO = anyAppt ? anyAppt.startAt.slice(0, 10) : new Date().toISOString().slice(0, 10);
  const dateHuman = fmtDate(dateISO);

  const { blocks, slots, durationMin } = computeFreeSlotsAndBlocks({
    bootstrap,
    locationTitle: "Clínica HiperDental Centro",
    serviceName: "Limpieza Dental",
  });

  const meta = {
    company: bootstrap.company?.name || "Empresa",
    locationTitle: "Clínica HiperDental Centro",
    serviceName: "Limpieza Dental",
    dateISO,
    dateHuman,
    durationMin,
  };

  console.log("\n=== DEBUG disponibilidad ===");
  console.log("- FREE_BLOCKS:", blocksToHuman(blocks, dateISO).join(", ") || "(ninguno)");
  console.log("- FREE_SLOTS (primeros):", slots.slice(0, 6).map((s) => s.startLocal).join(", ") || "(ninguno)");

  const reply = await askOpenAI({ question, meta, blocks, slots });

  console.log("\n=== RESPUESTA DEL AGENTE (estilo humano) ===");
  console.log(reply);

  // Nota: aquí NO reservamos automáticamente. Eso se hará tras confirmación del cliente.
  // if (slots.length > 0) {
  //   const created = await bookFirstSlot({ slot: slots[0], bootstrap });
  //   console.log("\n✅ Cita creada:", created.id, created.startAt);
  // }
}

main().catch((err) => console.error("❌ Error:", err.message || err));
