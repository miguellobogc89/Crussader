// lib/agents/chat/simpleMessageClassifier.ts
export type SimpleMessageResult =
  | { kind: "ACK"; reply: string }
  | { kind: "GREETING"; reply: string }
  | { kind: "REAL_MESSAGE" };

export type AppointmentSubReason =
  | "new"
  | "change"
  | "confirm"
  | "cancel"
  | "info"
  | "unknown";

function normalize(text: string): string {
  return String(text || "").trim().toLowerCase();
}

function includesOneOf(text: string, variants: string[]): boolean {
  for (const variant of variants) {
    if (text.includes(variant)) {
      return true;
    }
  }

  return false;
}

export function classifySimpleMessage(text: string): SimpleMessageResult {
  const t = normalize(text);

  const acks = [
    "ok",
    "vale",
    "perfecto",
    "gracias",
    "muchas gracias",
    "👍",
    "👌",
    "si",
    "sí",
  ];

  if (acks.includes(t)) {
    return {
      kind: "ACK",
      reply: "Perfecto 👍",
    };
  }

  const greetings = [
    "hola",
    "buenos dias",
    "buenos días",
    "buenas",
    "buenas tardes",
    "buenas noches",
  ];

  if (greetings.includes(t)) {
    return {
      kind: "GREETING",
      reply: "Hola 👋 ¿En qué puedo ayudarte?",
    };
  }

  return { kind: "REAL_MESSAGE" };
}

export function classifyAppointmentSubReason(args: {
  text: string;
  currentStep?: string | null;
  currentSubReason?: string | null;
}): AppointmentSubReason {
  const text = normalize(args.text);
  const currentStep = normalize(String(args.currentStep || ""));
  const currentSubReason = normalize(String(args.currentSubReason || ""));

  if (!text) {
    return "unknown";
  }

  if (
    includesOneOf(text, [
      "que cita tengo",
      "qué cita tengo",
      "cual es mi cita",
      "cuál es mi cita",
      "cuando es mi cita",
      "cuándo es mi cita",
      "a que hora tengo cita",
      "a qué hora tengo cita",
      "recuérdame mi cita",
      "recordarme mi cita",
      "quiero ver mi cita",
      "ver mi cita",
      "consultar mi cita",
      "informacion de mi cita",
      "información de mi cita",
      "datos de mi cita",
      "mi cita",
    ])
  ) {
    return "info";
  }

  if (
    includesOneOf(text, [
      "cancel",
      "cancela",
      "cancelar",
      "anula",
      "anular",
      "borra mi cita",
      "borrar mi cita",
      "elimina mi cita",
      "quitar cita",
      "quitar mi cita",
    ])
  ) {
    return "cancel";
  }

  if (
    includesOneOf(text, [
      "confirm",
      "confirma",
      "confirmar",
      "confirmo",
      "confirmada",
      "quiero confirmar",
      "confirmar mi cita",
      "confirmar la cita",
    ])
  ) {
    return "confirm";
  }

  if (
    includesOneOf(text, [
      "cambiar",
      "cambio",
      "cambiarla",
      "modificar",
      "mover",
      "reprogramar",
      "reagendar",
      "pasar la cita",
      "otra hora",
      "otro día",
      "otro dia",
      "adelantar",
      "retrasar",
    ])
  ) {
    return "change";
  }

  if (
    includesOneOf(text, [
      "pedir cita",
      "quiero una cita",
      "quiero cita",
      "necesito una cita",
      "reservar cita",
      "agendar cita",
      "coger cita",
      "sacar cita",
      "nueva cita",
      "solicitar cita",
    ])
  ) {
    return "new";
  }

  if (text === "cita" || text === "una cita") {
    return "new";
  }

  if (
    currentStep === "awaiting_service" ||
    currentStep === "awaiting_service_confirmation" ||
    currentStep === "awaiting_location" ||
    currentStep === "awaiting_datetime"
  ) {
    if (currentSubReason === "new") {
      return "new";
    }
  }

  if (currentStep === "awaiting_cancel_confirmation") {
    if (
      includesOneOf(text, [
        "si",
        "sí",
        "confirmar",
        "confirma",
        "adelante",
        "cancelar",
        "cancélala",
        "cancelala",
        "ok",
        "vale",
      ])
    ) {
      return "cancel";
    }
  }

  return "unknown";
}