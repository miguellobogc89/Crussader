// lib/crussader-assistant/capabilities/index.ts

export type CapabilityKey =
  | "MANAGE_EVENT"
  | "DELIVER_PRODUCT_NOW"
  | "ANSWER_INFORMATION"
  | "CASUAL_CONVERSATION"
  | "REGISTER_SUGGESTION";

export type CapabilityActionKey =
  | "CREATE"
  | "LIST"
  | "UPDATE"
  | "PAUSE"
  | "RESUME"
  | "CANCEL"
  | "DELIVER"
  | "ANSWER"
  | "REPLY"
  | "REGISTER";

export type CapabilityProductKey =
  | "REMINDER_ALERT"
  | "PRAYER"
  | "GOSPEL"
  | "PSALM"
  | "HOROSCOPE"
  | "NEWS"
  | "WEATHER"
  | "SPORT_EVENT";

export type CapabilityCatalogItem = {
  key: CapabilityKey;
  label: string;
  description: string;
  allowedActions: CapabilityActionKey[];
  allowedProducts?: CapabilityProductKey[];
};

export const CAPABILITIES_CATALOG: Record<CapabilityKey, CapabilityCatalogItem> = {
  MANAGE_EVENT: {
    key: "MANAGE_EVENT",
    label: "Gestionar avisos y eventos",
    description:
      "Crear, consultar, modificar, pausar, reanudar o cancelar avisos programados del usuario.",
    allowedActions: ["CREATE", "LIST", "UPDATE", "PAUSE", "RESUME", "CANCEL"],
    allowedProducts: [
      "REMINDER_ALERT",
      "PRAYER",
      "GOSPEL",
      "PSALM",
      "HOROSCOPE",
      "NEWS",
      "WEATHER",
      "SPORT_EVENT"
    ]
  },

  DELIVER_PRODUCT_NOW: {
    key: "DELIVER_PRODUCT_NOW",
    label: "Entregar contenido al momento",
    description:
      "Entregar directamente un contenido o producto en el momento, sin programarlo.",
    allowedActions: ["DELIVER"],
    allowedProducts: ["PRAYER", "GOSPEL", "PSALM", "HOROSCOPE", "NEWS", "WEATHER"]
  },

  ANSWER_INFORMATION: {
    key: "ANSWER_INFORMATION",
    label: "Responder preguntas",
    description:
      "Responder dudas generales o consultas informativas usando conocimiento o búsqueda externa.",
    allowedActions: ["ANSWER"]
  },

  CASUAL_CONVERSATION: {
    key: "CASUAL_CONVERSATION",
    label: "Conversación informal",
    description:
      "Mantener una charla natural sin ejecutar acciones ni buscar productos concretos.",
    allowedActions: ["REPLY"]
  },

  REGISTER_SUGGESTION: {
    key: "REGISTER_SUGGESTION",
    label: "Registrar sugerencias",
    description:
      "Recibir una sugerencia, propuesta o idea del usuario y dejarla registrada.",
    allowedActions: ["REGISTER"]
  }
};

export const CAPABILITY_KEYS = Object.keys(
  CAPABILITIES_CATALOG
) as CapabilityKey[];

export function getCapability(key: string | null) {
  if (!key) {
    return null;
  }

  const normalized = key.toUpperCase() as CapabilityKey;

  if (normalized in CAPABILITIES_CATALOG) {
    return CAPABILITIES_CATALOG[normalized];
  }

  return null;
}

export function isValidCapabilityAction(
  capabilityKey: string | null,
  actionKey: string | null
): boolean {
  const capability = getCapability(capabilityKey);

  if (!capability || !actionKey) {
    return false;
  }

  return capability.allowedActions.includes(
    actionKey.toUpperCase() as CapabilityActionKey
  );
}

export function isValidCapabilityProduct(
  capabilityKey: string | null,
  productKey: string | null
): boolean {
  const capability = getCapability(capabilityKey);

  if (!capability || !productKey) {
    return false;
  }

  if (!capability.allowedProducts) {
    return false;
  }

  return capability.allowedProducts.includes(
    productKey.toUpperCase() as CapabilityProductKey
  );
}

export function getCapabilitiesSummaryText(): string {
  return CAPABILITY_KEYS.map((capabilityKey) => {
    const capability = CAPABILITIES_CATALOG[capabilityKey];
    return `- ${capability.label}: ${capability.description}`;
  }).join("\n");
}

export function getCapabilitiesForPrompt() {
  return CAPABILITY_KEYS.map((capabilityKey) => {
    const capability = CAPABILITIES_CATALOG[capabilityKey];

    return {
      key: capability.key,
      label: capability.label,
      description: capability.description,
      allowedActions: capability.allowedActions,
      allowedProducts: capability.allowedProducts || []
    };
  });
}