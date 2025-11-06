/* app/config/integrations.ts */

/**
 * Catálogo estático de integraciones soportadas.
 * Cada provider puede tener uno o varios "scopes" o módulos.
 */

export type IntegrationScope = {
  key: string;             // p. ej. "reviews", "calendar"
  name: string;            // nombre legible
  description: string;     // texto corto para la card
  connectUrl: string;      // endpoint de conexión
};

export type IntegrationProvider = {
  key: string;             // "google", "meta", etc.
  name: string;            // Nombre público
  brandIcon: string;       // ruta de icono
  scopes: IntegrationScope[];
};

/* ─────────────── GOOGLE ─────────────── */
const googleScopes: IntegrationScope[] = [
  {
    key: "reviews",
    name: "Google Reviews",
    description: "Conecta tu Perfil de Empresa para importar y responder reseñas.",
    connectUrl: "/api/integrations/google/reviews/connect",
  },
  {
    key: "businessprofile",
    name: "Business Profile",
    description: "Sincroniza datos del perfil de empresa.",
    connectUrl: "/api/integrations/google/business-profile/connect",
  },
  {
    key: "calendar",
    name: "Google Calendar",
    description: "Sincroniza citas y eventos con Google Calendar.",
    connectUrl: "/api/integrations/google/calendar/connect",
  },
  {
    key: "gmail",
    name: "Gmail",
    description: "Conecta tu bandeja para responder mensajes por correo.",
    connectUrl: "/api/integrations/google/gmail/connect",
  },
];

/* ─────────────── META (Facebook / IG / WhatsApp) ─────────────── */
const metaScopes: IntegrationScope[] = [
  {
    key: "facebook",
    name: "Facebook",
    description: "Páginas, reseñas y mensajes de Facebook.",
    connectUrl: "/api/integrations/meta/facebook/connect",
  },
  {
    key: "instagram",
    name: "Instagram",
    description: "Conecta tu cuenta profesional para DMs y menciones.",
    connectUrl: "/api/integrations/meta/instagram/connect",
  },
  {
    key: "whatsapp",
    name: "WhatsApp Business",
    description: "Mensajería y atención al cliente por WhatsApp Business.",
    connectUrl: "/api/integrations/meta/whatsapp/connect",
  },
];

/* ─────────────── TRUSTPILOT / TRIPADVISOR / YELP ─────────────── */
const otherScopes: IntegrationScope[] = [
  {
    key: "trustpilot",
    name: "Trustpilot",
    description: "Sincroniza tus valoraciones de Trustpilot.",
    connectUrl: "/api/integrations/trustpilot/connect",
  },
  {
    key: "tripadvisor",
    name: "Tripadvisor",
    description: "Reseñas de viajes y experiencias.",
    connectUrl: "/api/integrations/tripadvisor/connect",
  },
  {
    key: "yelp",
    name: "Yelp",
    description: "Reputación y reseñas locales.",
    connectUrl: "/api/integrations/yelp/connect",
  },
];

/* ─────────────── EXPORTAR CATÁLOGO ─────────────── */
export const INTEGRATION_PROVIDERS: IntegrationProvider[] = [
  {
    key: "google",
    name: "Google",
    brandIcon: "/platform-icons/google.png",
    scopes: googleScopes,
  },
  {
    key: "meta",
    name: "Meta",
    brandIcon: "/platform-icons/meta.png",
    scopes: metaScopes,
  },
  {
    key: "others",
    name: "Otras plataformas",
    brandIcon: "/platform-icons/other.png",
    scopes: otherScopes,
  },
];

/**
 * Helper rápido para buscar un scope concreto.
 */
export function getIntegrationScope(providerKey: string, scopeKey: string) {
  const provider = INTEGRATION_PROVIDERS.find((p) => p.key === providerKey);
  return provider?.scopes.find((s) => s.key === scopeKey);
}
