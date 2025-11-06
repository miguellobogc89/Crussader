// app/server/integrations/status.service.ts
import "server-only";
import { prisma } from "@/app/server/db";
import { getIntegrationScope } from "@/app/config/integrations";

export type IntegrationStatus = "connected" | "pending" | "disconnected" | "limited" | "error";

export type IntegrationStatusItem = {
  provider: string;          // p.ej. "google"
  scope: string;             // p.ej. "reviews" | "calendar"
  status: IntegrationStatus; // estado calculado
  label?: string;            // texto opcional para chip
  hint?: string;             // tooltip/motivo
  updatedAt?: string;        // ISO
  accountEmail?: string | null;
  accountName?: string | null;
};

export type IntegrationStatusMap = Record<string, IntegrationStatusItem>; // key = `${provider}:${scope}`

/**
 * Devuelve un mapa de estados por provider/scope para el usuario/empresa.
 * Usa ExternalConnection(provider, scope) como fuente de verdad.
 */
export async function getStatusMap(opts: { userId?: string; companyId?: string }): Promise<IntegrationStatusMap> {
  const { userId, companyId } = opts;

  // Cargamos todas las conexiones visibles para el usuario/empresa.
  // Nota: si pasas ambos, filtramos por cualquiera de los dos.
  const whereAny: any[] = [];
  if (userId) whereAny.push({ userId });
  if (companyId) whereAny.push({ companyId });

  const connections = await prisma.externalConnection.findMany({
    where: whereAny.length ? { OR: whereAny } : undefined,
    select: {
      provider: true,
      scope: true,
      accountEmail: true,
      accountName: true,
      expires_at: true,
      updatedAt: true,
      access_token: true,
    },
  });

  const map: IntegrationStatusMap = {};

  for (const c of connections) {
    const provider = c.provider?.toLowerCase?.() ?? "unknown";
    const scope = (c.scope ?? "default").toLowerCase();
    const key = `${provider}:${scope}`;

    // Lógica de estado básica: conectado si hay token y no expiró; si expiró → disconnected.
    const nowSec = Math.floor(Date.now() / 1000);
    let status: IntegrationStatus = "disconnected";
    let label = "Sin conexión";
    let hint: string | undefined;

    const hasToken = !!c.access_token;
    const notExpired = c.expires_at == null || c.expires_at > nowSec;

    if (hasToken && notExpired) {
      status = "connected";
      label = "Conectado";
    } else if (hasToken && !notExpired) {
      status = "pending";
      label = "Reautenticar";
      hint = "El token ha caducado. Vuelve a conectar.";
    }

    // Ejemplo de “limited” si más adelante detectas rate limit/allowlist (dejamos hook):
    // if (provider === "google" && scope === "businessprofile" && noQuota) {
    //   status = "limited";
    //   label = "Conectado (sin cuota)";
    //   hint = "Business Profile conectado pero sin cuota disponible.";
    // }

    map[key] = {
      provider,
      scope,
      status,
      label,
      hint,
      updatedAt: c.updatedAt?.toISOString(),
      accountEmail: c.accountEmail,
      accountName: c.accountName,
    };
  }

  return map;
}

/**
 * Helper: construye la URL de conexión para un provider/scope.
 * Lee del catálogo estático (app/config/integrations.ts).
 */
export function getConnectUrl(providerKey: string, scopeKey: string, returnTo?: string) {
  const scope = getIntegrationScope(providerKey, scopeKey);
  if (!scope) return undefined;

  const url = new URL(scope.connectUrl, "http://local.placeholder"); // base dummy para manipular params
  if (returnTo) url.searchParams.set("returnTo", returnTo);

  // Devolvemos solo path+query
  const q = url.searchParams.toString();
  return q ? `${url.pathname}?${q}` : url.pathname;
}
