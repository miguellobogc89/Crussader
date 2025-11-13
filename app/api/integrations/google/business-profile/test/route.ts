import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/db";
import { google } from "googleapis";
import { cookies } from "next/headers";

export const runtime = "nodejs";

/* ─────────────────────────────
   Helper: sacar userId de la sesión
   ───────────────────────────── */
async function getUserIdFromSession() {
  const jar = await cookies();
  const sessionToken =
    jar.get("__Secure-next-auth.session-token")?.value ??
    jar.get("next-auth.session-token")?.value;

  if (!sessionToken) return null;

  const session = await prisma.session.findFirst({
    where: { sessionToken },
    select: { userId: true },
  });

  return session?.userId ?? null;
}

/* ─────────────────────────────
   GET /api/integrations/google/business-profile/test
   ───────────────────────────── */
export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "no_session" },
        { status: 401 }
      );
    }

    // 1) Buscar la conexión de Google Business para este usuario
    const connection = await prisma.externalConnection.findFirst({
      where: {
        userId,
        provider: {
          in: [
            "google_business_profile",
            "google_business",
            "google-business-profile",
          ],
        },
      },
      select: {
        access_token: true,
        refresh_token: true,
        expires_at: true,
      },
    });

    if (!connection) {
      return NextResponse.json(
        { ok: false, error: "no_connection" },
        { status: 400 }
      );
    }

    // 2) Cliente OAuth2
    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_BUSINESS_REDIRECT_URI
    );

    client.setCredentials({
      access_token: connection.access_token,
      refresh_token: connection.refresh_token ?? undefined,
    });

    // 3) Usar la API de *Account Management* (ahora sí tiene accounts.list)
    const myBusiness = google.mybusinessaccountmanagement({
      version: "v1",
      auth: client,
    });

    const accounts = await myBusiness.accounts.list({});

    return NextResponse.json(
      {
        ok: true,
        data: accounts.data,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("GBP TEST ERROR:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "unknown_error" },
      { status: 500 }
    );
  }
}
