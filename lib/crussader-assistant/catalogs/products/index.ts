// lib/crussader-assistant/catalogs/products/index.ts

export type ProductKey =
  | "REMINDER"
  | "CONTENT_DELIVERY"
  | "SPORT_EVENT_ALERT";

export type ProductCatalogItem = {
  key: ProductKey;
  name: string;
  description: string;
  actionModule: string;
  allowedActions: string[];
};

export const PRODUCT_CATALOG: Record<ProductKey, ProductCatalogItem> = {
  REMINDER: {
    key: "REMINDER",
    name: "Recordatorios",
    description:
      "Permite crear recordatorios sobre cualquier cosa que el usuario quiera recordar en una fecha o frecuencia determinada.",
    actionModule: "events",
    allowedActions: ["CREATE", "UPDATE", "CANCEL", "LIST"]
  },

  CONTENT_DELIVERY: {
    key: "CONTENT_DELIVERY",
    name: "Envíos programados",
    description:
      "Permite programar envíos periódicos o puntuales de contenido como noticias, tiempo, oraciones, horóscopo o jornada de liga.",
    actionModule: "subscriptions",
    allowedActions: ["CREATE", "UPDATE", "CANCEL", "LIST"]
  },

  SPORT_EVENT_ALERT: {
    key: "SPORT_EVENT_ALERT",
    name: "Avisos deportivos",
    description:
      "Permite activar avisos sobre eventos de partidos como inicio, final, goles o tarjetas rojas.",
    actionModule: "alerts",
    allowedActions: ["CREATE", "UPDATE", "CANCEL", "LIST"]
  }
};

export const PRODUCT_KEYS = Object.keys(PRODUCT_CATALOG) as ProductKey[];

export function getProduct(key: string | null) {
  if (!key) {
    return null;
  }

  const normalized = key.toUpperCase() as ProductKey;

  if (normalized in PRODUCT_CATALOG) {
    return PRODUCT_CATALOG[normalized];
  }

  return null;
}