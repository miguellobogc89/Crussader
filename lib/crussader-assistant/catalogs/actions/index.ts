// lib/crussader-assistant/catalogs/actions/index.ts

export type ActionKey =
  | "CREATE"
  | "UPDATE"
  | "CANCEL"
  | "LIST";

export type ActionCatalogItem = {
  key: ActionKey;
  name: string;
  description: string;
};

export const ACTION_CATALOG: Record<ActionKey, ActionCatalogItem> = {
  CREATE: {
    key: "CREATE",
    name: "Crear",
    description:
      "Crear un nuevo elemento como un recordatorio, una suscripción o una alerta."
  },

  UPDATE: {
    key: "UPDATE",
    name: "Modificar",
    description:
      "Modificar la configuración de un elemento existente."
  },

  CANCEL: {
    key: "CANCEL",
    name: "Cancelar",
    description:
      "Cancelar o eliminar un elemento existente."
  },

  LIST: {
    key: "LIST",
    name: "Consultar",
    description:
      "Consultar o listar elementos existentes."
  }
};

export const ACTION_KEYS = Object.keys(ACTION_CATALOG) as ActionKey[];

export function getAction(key: string | null) {
  if (!key) {
    return null;
  }

  const normalized = key.toUpperCase() as ActionKey;

  if (normalized in ACTION_CATALOG) {
    return ACTION_CATALOG[normalized];
  }

  return null;
}