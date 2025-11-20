// lib/integrations/google-business/client.ts
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import type { ExternalConnection } from "@prisma/client";

const PROVIDER = "google-business";

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

function getRedirectUri() {
  return (
    process.env.GOOGLE_BUSINESS_REDIRECT_URI ||
    `${getAppUrl()}/api/integrations/google/business-profile/callback`
  );
}

function getOAuthClient() {
  const clientId = process.env.GOOGLE_BUSINESS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_BUSINESS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "[GBP] Missing GOOGLE_BUSINESS_CLIENT_ID or GOOGLE_BUSINESS_CLIENT_SECRET",
    );
  }

  return new google.auth.OAuth2(clientId, clientSecret, getRedirectUri());
}

/**
 * Busca la ExternalConnection de GOOGLE BUSINESS para una company.
 * Siempre coge la más reciente.
 */
export async function getExternalConnectionForCompany(companyId: string) {
  const ext = await prisma.externalConnection.findFirst({
    where: { companyId, provider: PROVIDER },
    orderBy: { createdAt: "desc" },
  });

  if (!ext) {
    throw new Error("[GBP] No ExternalConnection found for company");
  }

  if (!ext.access_token && !ext.refresh_token) {
    throw new Error("[GBP] ExternalConnection has no tokens");
  }

  return ext;
}

/**
 * Devuelve un access_token válido (refresca si hace falta) y persiste el nuevo token.
 */
export async function getValidAccessToken(
  ext: ExternalConnection,
): Promise<string> {
  let accessToken = ext.access_token ?? null;

  const nowSec = Math.floor(Date.now() / 1000);
  const isExpired =
    typeof ext.expires_at === "number" && ext.expires_at < nowSec - 60;

  // Si no hay accessToken o está vencido, intentamos refresh
  if ((!accessToken || isExpired) && ext.refresh_token) {
    const client = getOAuthClient();

    try {
      client.setCredentials({ refresh_token: ext.refresh_token });
      const newTokenResp = await client.getAccessToken();
      const newAccessToken = newTokenResp?.token ?? null;

      if (!newAccessToken) {
        throw new Error("[GBP] empty_access_token_after_refresh");
      }

      accessToken = newAccessToken;

      const expiryMs = client.credentials.expiry_date;
      const newExpiresAtSec =
        typeof expiryMs === "number"
          ? Math.floor(expiryMs / 1000)
          : null;

      await prisma.externalConnection.update({
        where: { id: ext.id },
        data: {
          access_token: newAccessToken,
          expires_at: newExpiresAtSec ?? undefined,
        },
      });
    } catch (err) {
      console.error("[GBP] error refreshing token:", err);
      throw new Error("[GBP] token_refresh_failed");
    }
  }

  if (!accessToken) {
    throw new Error("[GBP] no_valid_access_token");
  }

  return accessToken;
}

/**
 * Llama a accounts.list y devuelve el array crudo de cuentas GBP.
 */
export async function listGbpAccounts(
  accessToken: string,
): Promise<
  { name?: string; accountName?: string | null; [k: string]: any }[]
> {
  const resp = await fetch(
    "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    console.error(
      "[GBP] accounts.list failed",
      resp.status,
      text.slice(0, 300),
    );
    throw new Error(`[GBP] accounts_list_failed_${resp.status}`);
  }

  const data = (await resp.json()) as {
    accounts?: { name?: string; accountName?: string | null; [k: string]: any }[];
  };

  return Array.isArray(data.accounts) ? data.accounts : [];
}

/**
 * Helper: normaliza un googleAccountId tipo "11814..." en "accounts/11814..."
 */
export function toAccountResourceName(googleAccountId: string): string {
  const trimmed = googleAccountId.trim();
  if (!trimmed) {
    throw new Error("[GBP] Invalid googleAccountId");
  }
  if (trimmed.startsWith("accounts/")) {
    return trimmed;
  }
  return `accounts/${trimmed}`;
}

/**
 * Llama a locations.list (Business Information API) para un account.
 * Devuelve el JSON crudo de locations.
 */
export async function listGbpLocationsForAccount(
  googleAccountId: string,
  accessToken: string,
): Promise<any[]> {
  const accountName = toAccountResourceName(googleAccountId);

  // IMPORTANT: usar solo los campos que ya sabes que funcionan
  const readMask = [
    "name",
    "title",
    "storeCode",
    "metadata",
    "regularHours",
    "serviceArea",
    "websiteUri",
    "phoneNumbers",
    "languageCode",
  ].join(",");

  const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=${encodeURIComponent(
    readMask,
  )}`;

  const resp = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    console.error(
      "[GBP] locations.list failed",
      resp.status,
      text.slice(0, 300),
    );
    throw new Error(`[GBP] locations_list_failed_${resp.status}`);
  }

  const json = (await resp.json()) as any;
  const rawLocations = Array.isArray(json.locations) ? json.locations : [];

  return rawLocations;
}

/**
 * Llama a reviews.list (MyBusiness API v4) para una location.
 * locationResourceName debe ser "accounts/{acc}/locations/{loc}".
 * Devuelve { reviews, nextPageToken? }
 */
export async function listGbpReviewsForLocation(params: {
  locationResourceName: string; // "accounts/.../locations/..."
  accessToken: string;
  pageToken?: string;
}): Promise<{ reviews: any[]; nextPageToken?: string }> {
  const { locationResourceName, accessToken, pageToken } = params;

  const baseUrl = `https://mybusiness.googleapis.com/v4/${locationResourceName}/reviews`;
  const url =
    pageToken != null && pageToken !== ""
      ? `${baseUrl}?pageToken=${encodeURIComponent(pageToken)}`
      : baseUrl;

  const resp = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    console.error(
      "[GBP] reviews.list failed",
      resp.status,
      text.slice(0, 300),
    );
    throw new Error(`[GBP] reviews_list_failed_${resp.status}`);
  }

  const json = (await resp.json()) as {
    reviews?: any[];
    nextPageToken?: string;
  };

  return {
    reviews: Array.isArray(json.reviews) ? json.reviews : [],
    nextPageToken: json.nextPageToken,
  };
}
