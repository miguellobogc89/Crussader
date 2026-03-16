// lib/crussader-assistant/catalogs/needs/index.ts

export const NEED_CATALOG = {

  GREETING: {
    key: "GREETING"
  },

  CHAT: {
    key: "CHAT"
  },

  INFORMATION: {
    key: "INFORMATION"
  },

  CREATE: {
    key: "CREATE"
  },

  UPDATE: {
    key: "UPDATE"
  },

  CANCEL: {
    key: "CANCEL"
  },

  QUERY: {
    key: "QUERY"
  },

  UNKNOWN: {
    key: "UNKNOWN"
  }

} as const;

export const NEED_KEYS = Object.keys(NEED_CATALOG);

export function getNeed(key: string | null) {
  if (!key) {
    return null;
  }

  const normalized = key.toUpperCase();

  if (normalized in NEED_CATALOG) {
    return NEED_CATALOG[normalized as keyof typeof NEED_CATALOG];
  }

  return null;
}