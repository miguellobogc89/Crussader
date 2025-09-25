// agent-openai-mock.js — Node 22 (ESM)
// Calcula huecos y usa settings de empresa (si tienes el puente). Aquí sin settings externos para exportar fácil.

import { config as dotenvConfig } from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

dotenvConfig({ path: ".env.local" });
if (!process.env.OPENAI_API_KEY || !process.env.CALENDAR_API_KEY) dotenvConfig();

const BASE_URL = process.env.AGENT_BASE_URL || "http://localhost:3000";
const API_KEY = process.env.CALENDAR_API_KEY;
const COMPANY_ID = "cmfmxqxqx0000i5i4ph2bb3ij";
const OPENAI_MODEL = "gpt-4o-mini";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) throw new Error("Falta OPENAI_API_KEY");
if (!API_KEY) throw new Error("Falta CALENDAR_API_KEY");

// ====== TZ helpers (MVP) ======
const MADRID_OFFSET_MIN = 120;
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
  const h = Math.floor(mins / 60) % 24;
  const mm = mins % 60;
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

// ====== Horarios Location (con exceptions) ======
function getDow(dateISO) {
  const d = new Date(`${dateISO}T00:00:00Z`);
  return d.getUTCDay();
}
function getWorkWindowsForDate(location, dateISO) {
  const oh = location.openingHours || null;
  const ex = Array.isArray(location.exceptions) ? location.exceptions : [];
  const exToday = ex.find((e) => e.date === dateISO);
  if (exToday) {
    if (exToday.isClosed) return [];
    const wins = Array.isArray(exToday.windows) ? exToday.windows : [];
    return wins.map((w) => ({ start: Number(w.startMin)||0, end: Number(w.endMin)||0 }))
               .filter((w) => w.end > w.start);
  }
  if (!oh || !Array.isArray(oh.week)) return [];
  const dow = getDow(dateISO);
  const day = oh.week.find((d) => d.dow === dow);
  if (!day || day.isClosed) return [];
  return (day.windows||[]).map((w) => ({ start: Number(w.startMin)||0, end: Number(w.endMin)||0 }))
                          .filter((w) => w.end > w.start);
}

// ====== Disponibilidad ======
function mergeOccupiedInWindow(appointments, windowStart, windowEnd) {
  const taken = appointments
    .map((a) => ({ start: toMinutesLocal(a.startAt), end: toMinutesLocal(a.endAt) }))
    .map(({ start, end }) => ({ start: Math.max(start, windowStart), end: Math.min(end, windowEnd) }))
    .filter((b) => b.end > b.start)
    .sort((a, b) => a.start - b.start);
  const merged = [];
  for (const b of taken) {
    if (!merged.length || b.start > merged[merged.length - 1].end) merged.push({ ...b });
    else merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, b.end);
  }
  return merged;
}
function freeFromOccupied(occupied, windowStart, windowEnd) {
  const free = [];
  let cur = windowStart;
  for (const b of occupied) {
    if (b.start > cur) free.push({ start: cur, end: b.start });
    cur = Math.max(cur, b.end);
  }
  if (cur < windowEnd) free.push({ start: cur, end: windowEnd });
  return free;
}
function blocksToHuman(blocks, dateISO) {
  return blocks.map((b) => {
    const sIso = fromMinutesLocalToIso(dateISO, b.start);
    const eIso = fromMinutesLocalToIso(dateISO, b.end);
    return `${fmtHourLocal(sIso)}–${fmtHourLocal(eIso)}`;
  });
}
function computeFreeSlotsAndBlocks({ bootstrap, locationTitle, serviceName }) {
  const loc = (bootstrap.company?.locations || []).find((l) => l.title === locationTitle);
  if (!loc) return { dateISO: null, durationMin: 0, blocks: [], slots: [] };
  const service = (loc.services || []).find((s) => (s.name||"").toLowerCase() === (serviceName||"").toLowerCase());
  if (!service) return { dateISO: null, durationMin: 0, blocks: [], slots: [] };

  const anyAppt = (bootstrap.appointments || []).find((a) => a.location?.title === locationTitle);
  const dateISO = anyAppt ? anyAppt.startAt.slice(0, 10) : new Date().toISOString().slice(0, 10);
  const duration = service.durationMin || 45;

  const workWins = getWorkWindowsForDate(loc, dateISO);
  if (!workWins.length) return { dateISO, durationMin: duration, blocks: [], slots: [] };

  const todaysAppts = (bootstrap.appointments || []).filter((a) => a.location?.title === locationTitle);
  const freeBlocks = [];
  for (const win of workWins) {
    const occ = mergeOccupiedInWindow(todaysAppts, win.start, win.end);
    freeBlocks.push(...freeFromOccupied(occ, win.start, win.end));
  }

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

// ====== (Opcional) slots representativos ======
function pickRepresentativeSlots(slots, blocks, max = 3) {
  if (!slots?.length) return [];
  if (!blocks?.length) return slots.slice(0, Math.min(max, slots.length));
  const picks = [];
  for (const b of blocks) {
    const found = slots.find(s => {
      const m = toMinutesLocal(s.startIso);
      return m >= b.start && m < b.end;
    });
    if (found) picks.push(found);
    if (picks.length >= max) break;
  }
  let i = 0;
  while (picks.length < max && i < slots.length) {
    const cand = slots[i++];
    if (!picks.some(p => p.startIso === cand.startIso)) picks.push(cand);
  }
  return picks.slice(0, max);
}

// ====== OpenAI ======
async function askOpenAI({ question, meta, blocks, slots, suggestedSlotsText }) {
  const systemPrompt = `
Eres una recepcionista joven de una clínica dental. Amable, directa y profesional.
No te presentes como IA ni inventes horarios. Sé breve y práctica.
`.trim();

  const FREE_BLOCKS = blocksToHuman(blocks, meta.dateISO).join(", ") || "(sin tramos)";
  const SUGGESTED_SLOTS = suggestedSlotsText ||
    (pickRepresentativeSlots(slots, blocks, 3).map(s => s.startLocal).join(", ") || "(sin sugerencias)");

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "system", content: `META: ${JSON.stringify(meta)}` },
    { role: "system", content: `FREE_BLOCKS: ${FREE_BLOCKS}` },
    { role: "system", content: `SUGGESTED_SLOTS: ${SUGGESTED_SLOTS}` },
    { role: "user", content: question },
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: OPENAI_MODEL, temperature: 0.3, max_tokens: 300, messages }),
  });
  if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content?.trim() || "(sin respuesta)";
}

// ====== MAIN demo ======
async function main() {
  const bootstrap = await fetchBootstrap();
  const { blocks, slots, durationMin, dateISO } = computeFreeSlotsAndBlocks({
    bootstrap,
    locationTitle: "Clínica HiperDental Centro",
    serviceName: "Limpieza Dental",
  });

  const meta = {
    company: bootstrap.company?.name || "Empresa",
    locationTitle: "Clínica HiperDental Centro",
    serviceName: "Limpieza Dental",
    dateISO,
    dateHuman: fmtDate(dateISO),
    durationMin,
  };

  console.log("\n=== DEBUG disponibilidad ===");
  console.log("- FREE_BLOCKS:", blocksToHuman(blocks, dateISO).join(", ") || "(ninguno)");
  console.log("- SUGGESTED_SLOTS:", pickRepresentativeSlots(slots, blocks, 3).map(s=>s.startLocal).join(", ") || "(ninguno)");

  const reply = await askOpenAI({
    question: "¿Qué huecos hay hoy para una limpieza dental en la Clínica HiperDental Centro?",
    meta, blocks, slots,
  });
  console.log("\n=== RESPUESTA DEL AGENTE ===\n" + reply);
}

// Detectar ejecución directa vs import
const isDirect = fileURLToPath(import.meta.url) === path.resolve(process.argv[1] || "");
if (isDirect) {
  main().catch((err) => console.error("❌ Error:", err.message || err));
}

// Exports para el simulador
export {
  fetchBootstrap,
  computeFreeSlotsAndBlocks,
  blocksToHuman,
  askOpenAI,
  pickRepresentativeSlots,
  fmtDate,
};
