// lib/crussader-assistant/intake/intakeCatalog.ts

export const intakeCatalog = {
  capabilities: [
    {
      key: "CREATE_EVENT",
      label: "Crear recordatorios",
      description:
        "Crear recordatorios o avisos para una fecha, hora o recurrencia.",
      requiredFields: ["eventName", "time"],
      optionalFields: ["date", "recurrence", "days", "description"]
    },
    {
      key: "LIST_EVENTS",
      label: "Consultar recordatorios",
      description:
        "Listar o consultar recordatorios, avisos o eventos ya guardados del usuario.",
      requiredFields: [],
      optionalFields: ["status", "eventName", "date", "time"]
    },
    {
      key: "UPDATE_EVENT",
      label: "Modificar recordatorios",
      description:
        "Cambiar datos de un recordatorio o aviso existente, como hora, fecha, nombre o recurrencia.",
      requiredFields: [],
      optionalFields: ["eventName", "date", "time", "recurrence", "days", "status"]
    },
    {
      key: "PAUSE_EVENT",
      label: "Pausar recordatorios",
      description:
        "Pausar temporalmente un recordatorio, aviso o suscripción existente.",
      requiredFields: [],
      optionalFields: ["eventName", "status"]
    },
    {
      key: "RESUME_EVENT",
      label: "Reanudar recordatorios",
      description:
        "Reanudar un recordatorio, aviso o suscripción pausada.",
      requiredFields: [],
      optionalFields: ["eventName", "status"]
    },
    {
      key: "CANCEL_EVENT",
      label: "Cancelar recordatorios",
      description:
        "Cancelar, borrar, eliminar, parar o desactivar un recordatorio, aviso o suscripción existente.",
      requiredFields: [],
      optionalFields: ["eventName", "status"]
    },
    {
      key: "CANCEL_ALL_EVENTS",
      label: "Cancelar todos los recordatorios",
      description:
        "Cancelar, borrar, eliminar o parar todos los recordatorios, avisos o suscripciones del usuario.",
      requiredFields: [],
      optionalFields: ["status"]
    },
    {
      key: "SUBSCRIBE_CONTENT",
      label: "Suscribirse a contenido",
      description:
        "Suscribir al usuario a contenido periódico como evangelio, salmo, noticias o similares.",
      requiredFields: ["contentType", "time", "frequency"],
      optionalFields: ["topic", "location", "days"]
    },
    {
      key: "QUERY_INFORMATION",
      label: "Resolver dudas",
      description:
        "Responder preguntas generales o ayudar al usuario a entender algo.",
      requiredFields: [],
      optionalFields: ["question", "topic", "location"]
    }
  ]
} as const;

export type IntakeCapability = (typeof intakeCatalog.capabilities)[number];
export type IntakeCapabilityKey = IntakeCapability["key"];