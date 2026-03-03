// lib/agents/stages/needDetectionStage.ts
import { readSessionBoard, type StageResult } from "@/lib/agents/chat/sessionBoardHydrator";
import { extractPersonName } from "@/lib/agents/actions/extractPersonName";

export type NeedIntent = "BOOKING" | "NON_BOOKING" | "UNKNOWN";

export type NeedOutput = {
  intent: NeedIntent;
  bookingRelated: boolean;
  needText: string | null;
};

function cleanText(s: string): string {
  return String(s || "").replace(/\s+/g, " ").trim();
}

function getDoneFlag(board: any): boolean {
  const rec = board?.state?.stages?.need;
  if (!rec || typeof rec !== "object") return false;
  return rec.done === true;
}

function looksLikeGreetingOnly(text: string): boolean {
  const t = cleanText(text).toLowerCase();
  if (!t) return true;
  if (t.length > 40) return false;

  const greetings = [
    "hola",
    "buenas",
    "buenos dias",
    "buenas tardes",
    "buenas noches",
    "hey",
    "buen día",
    "buenas!",
  ];

  for (const g of greetings) {
    if (t === g) return true;
    if (t.startsWith(g + " ")) return false;
  }

  if (t === "ok") return true;
  if (t === "vale") return true;

  return false;
}

function detectBookingRelated(text: string): boolean {
  const t = cleanText(text).toLowerCase();

  const patterns = [
    "cita",
    "citas",
    "reserv",
    "reserva",
    "reservar",
    "agendar",
    "agenda",
    "turno",
    "turnos",
    "hora",
    "horario",
    "disponibilidad",
    "disponible",
    "mañana",
    "hoy",
    "esta tarde",
    "esta semana",
    "próxima semana",
    "proxima semana",
    "cuando puedo",
    "quiero pedir",
    "quiero una cita",
    "quiero una hora",
  ];

  for (const p of patterns) {
    if (t.includes(p)) return true;
  }

  return false;
}

function extractNeedFromText(userText: string): string | null {
  const t = cleanText(userText);
  if (!t) return null;

  if (looksLikeGreetingOnly(t)) return null;

  return t;
}

export async function needStage(args: {
  sessionId: string;
  userText: string;
}): Promise<{ result: StageResult; out: NeedOutput }> {
  const sessionId = String(args.sessionId || "").trim();
  if (!sessionId) throw new Error("Missing sessionId");

  const userText = cleanText(args.userText);

  const board = await readSessionBoard(sessionId);
  const alreadyDone = getDoneFlag(board);

  const bookingRelated = detectBookingRelated(userText);

  // Regla para no confundir “solo me da el nombre” como necesidad
  const parsedName = await extractPersonName({ text: userText });
  const isOnlyName = !!parsedName && userText.length <= 40;

  const needCandidate = isOnlyName ? null : extractNeedFromText(userText);
  const hasNeed = !!needCandidate;

  let intent: NeedIntent = "UNKNOWN";
  if (bookingRelated) intent = "BOOKING";
  if (!bookingRelated && hasNeed) intent = "NON_BOOKING";

  const out: NeedOutput = {
    intent,
    bookingRelated,
    needText: hasNeed ? needCandidate : null,
  };

  if (alreadyDone) {
    return {
      result: { done: true, missing: [] },
      out,
    };
  }

  const missing: string[] = [];
  if (!hasNeed) missing.push("need");

  const done = missing.length === 0;

  const result: StageResult = {
    done,
    missing,
    board_patch: {
      state: {
        stages: {
          need: {
            done,
            intent,
            bookingRelated,
            updatedAt: new Date().toISOString(),
          },
        },
        need: {
          text: hasNeed ? needCandidate : null,
        },
      },
    },
  };

  return { result, out };
}