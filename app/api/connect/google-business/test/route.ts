// app/api/connect/google-business/test/route.ts  (ajusta la ruta si tu archivo está en otro sitio)
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
// ⬇️ Si este import da error, cambia a "../../../auth/[...nextauth]/route"
import { authOptions } from "../../../auth/[...nextauth]/route";
import { errorMessage } from "@/lib/error-message";


const prisma = new PrismaClient();
const MOCK_MODE = process.env.GOOGLE_BUSINESS_MOCK === "1";

function getFixedParentFromEnv() {
  const name = process.env.GOOGLE_BUSINESS_ACCOUNT_NAME;
  if (!name) return null;
  if (!/^accounts\/\d+$/i.test(name)) return null;
  return name; // p.ej. "accounts/12345678901234567890"
}

async function refreshAccessToken(refresh_token: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_BUSINESS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_BUSINESS_CLIENT_SECRET!,
      refresh_token,
      grant_type: "refresh_token",
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Refresh failed: ${JSON.stringify(json)}`);
  return {
    access_token: json.access_token as string,
    expires_at: json.expires_in ? Math.floor(Date.now() / 1000) + Number(json.expires_in) : undefined,
  };
}

async function fetchGoogleJSON(url: string, access_token: string) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${access_token}` }, cache: "no-store" });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

export async function GET(_req: NextRequest) {
  try {
    // 1) Usuario actual
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ ok: false, error: "not_logged_in" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ ok: false, error: "user_not_found" }, { status: 404 });

    // 2) Conexión guardada
    let conn = await prisma.externalConnection.findUnique({
      where: { userId_provider: { userId: user.id, provider: "google-business" } },
    });
    if (!conn) return NextResponse.json({ ok: false, error: "no_external_connection" }, { status: 404 });

    // 3) Refrescar si está caducado o cerca (60s margen)
    const now = Math.floor(Date.now() / 1000);
    if ((conn.expires_at ?? 0) < now + 60 && conn.refresh_token) {
      const refreshed = await refreshAccessToken(conn.refresh_token);
      conn = await prisma.externalConnection.update({
        where: { userId_provider: { userId: user.id, provider: "google-business" } },
        data: { access_token: refreshed.access_token, expires_at: refreshed.expires_at },
      });
    }

    // 4) MOCK rápido (para desarrollar con cuota 0)
    if (MOCK_MODE) {
      return NextResponse.json({
        ok: true,
        account_used: "accounts/1234567890",
        accounts_count: 1,
        sample_locations_count: 2,
        sample_locations: [
          { name: "accounts/1234567890/locations/111", title: "Cafetería Prueba", storeCode: "LOC1" },
          { name: "accounts/1234567890/locations/222", title: "Restaurante Demo", storeCode: "LOC2" },
        ],
      });
    }

    // 5) Si hay parent fijo en .env, saltamos la API de cuentas (útil con cuota 0)
    let parent: string | null = getFixedParentFromEnv();

    // 6) Si no hay parent fijo, intentar listar cuentas (Account Management API)
    if (!parent) {
      const ACC_URL = "https://mybusinessaccountmanagement.googleapis.com/v1/accounts";
      let accountsRes = await fetchGoogleJSON(ACC_URL, conn.access_token);

      // Reintento con refresh si 401
      if (!accountsRes.ok && accountsRes.status === 401 && conn.refresh_token) {
        const refreshed = await refreshAccessToken(conn.refresh_token);
        conn = await prisma.externalConnection.update({
          where: { userId_provider: { userId: user.id, provider: "google-business" } },
          data: { access_token: refreshed.access_token, expires_at: refreshed.expires_at },
        });
        accountsRes = await fetchGoogleJSON(ACC_URL, conn.access_token);
      }

      if (!accountsRes.ok) {
        // Si cuota 0 (429) y tenemos parent en .env mal formado/ausente, devolvemos error claro
        return NextResponse.json({ ok: false, step: "accounts", error: accountsRes.body }, { status: accountsRes.status });
      }

      const accounts = (accountsRes.body.accounts ?? []) as Array<{ name: string }>;
      if (!accounts.length) {
        return NextResponse.json({ ok: true, accounts: [], locations: [] });
      }
      parent = accounts[0].name; // "accounts/XXXXXXXX"
    }

    // 7) Listar ubicaciones (Business Information API)
    const locationsURL =
      `https://mybusinessbusinessinformation.googleapis.com/v1/${parent}/locations` +
      `?readMask=name,title,storeCode,languageCode,metadata,profile,storefrontAddress,primaryPhone,websiteUri`;

    let locRes = await fetchGoogleJSON(locationsURL, conn.access_token);

    // Reintento con refresh si 401
    if (!locRes.ok && locRes.status === 401 && conn.refresh_token) {
      const refreshed = await refreshAccessToken(conn.refresh_token);
      conn = await prisma.externalConnection.update({
        where: { userId_provider: { userId: user.id, provider: "google-business" } },
        data: { access_token: refreshed.access_token, expires_at: refreshed.expires_at },
      });
      locRes = await fetchGoogleJSON(locRes ? locationsURL : locationsURL, conn.access_token);
    }

    if (!locRes.ok) {
      return NextResponse.json({ ok: false, step: "locations", error: locRes.body }, { status: locRes.status });
    }

    // 8) Respuesta (recorta a 5)
    const locations = Array.isArray(locRes.body.locations) ? locRes.body.locations.slice(0, 5) : [];
    return NextResponse.json({
      ok: true,
      account_used: parent,
      sample_locations_count: locations.length,
      sample_locations: locations,
    });
  } catch (e: unknown) {
    console.error("[GB connect test] ", e);
    return NextResponse.json(
      { ok: false, error: "internal_error", message: errorMessage(e) },
      { status: 500 },
    );
  }
}
