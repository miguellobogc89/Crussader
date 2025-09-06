// lib/googleBusiness.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TOKEN_URL = "https://oauth2.googleapis.com/token";

type ExternalConn = {
  id: string;
  userId: string;
  provider: string;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: number | null; // epoch seconds
};

function isExpired(expires_at: number | null) {
  if (!expires_at) return false;
  // margen de seguridad 60s
  return Math.floor(Date.now() / 1000) >= (expires_at - 60);
}

/** Devuelve un access token válido para Google Business, refrescando si hace falta. */
export async function getGbAccessToken(userId: string): Promise<string> {
  const conn = await prisma.externalConnection.findFirst({
    where: { userId, provider: "google-business" },
  }) as unknown as ExternalConn | null;

  if (!conn?.access_token) {
    throw new Error("no_google_business_connection");
  }

  // Si no expira o no tenemos expires_at, usa el actual
  if (!isExpired(conn.expires_at)) {
    return conn.access_token!;
  }

  if (!conn.refresh_token) {
    // sin refresh token no podemos renovar
    return conn.access_token!;
  }

  // Refresh
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_BUSINESS_CLIENT_ID!,
    client_secret: process.env.GOOGLE_BUSINESS_CLIENT_SECRET!,
    grant_type: "refresh_token",
    refresh_token: conn.refresh_token!,
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  if (!res.ok) {
    // Si falla el refresh, devuelve el viejo (último recurso) para no romper flujo;
    // el caller decidirá si aborta.
    return conn.access_token!;
  }

  const json: {
    access_token: string;
    expires_in?: number;
    token_type?: string;
    scope?: string;
  } = await res.json();

  const newAccess = json.access_token;
  const newExpiresAt = json.expires_in
    ? Math.floor(Date.now() / 1000) + json.expires_in
    : null;

  await prisma.externalConnection.update({
    where: { userId_provider: { userId, provider: "google-business" } },
    data: {
      access_token: newAccess,
      expires_at: newExpiresAt,
    },
  });

  return newAccess;
}

/** GET helper con Authorization ya incluido. */
export async function gbFetch(
  url: string,
  userId: string,
  init: RequestInit = {}
) {
  const token = await getGbAccessToken(userId);
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
  return res;
}

/** Nombre de cuenta, p.ej. "accounts/01864766658721327436" */
export function getGbAccountName(): string {
  const name = process.env.GOOGLE_BUSINESS_ACCOUNT_NAME;
  if (!name) throw new Error("missing_GOOGLE_BUSINESS_ACCOUNT_NAME");
  return name;
}
