import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { google } from "googleapis";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Opcional pero recomendado en app router
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lista próximos eventos de Google Calendar.
 *
 * Prioridades para elegir conexión (en este orden):
 *  1) ?connectionId=<id exacto de ExternalConnection>
 *  2) ?companyId=<id de Company>  (si quieres forzar por empresa)
 *  3) conexión por USUARIO de la sesión (buscando el User por email)
 *
 * Ejemplos:
 *  GET /api/google/calendar/list                    -> usa conexión del usuario en sesión
 *  GET /api/google/calendar/list?companyId=XYZ      -> usa conexión de esa empresa
 *  GET /api/google/calendar/list?connectionId=ABC   -> usa esa conexión exacta
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
    }

    const url = new URL(req.url);
    const companyId = url.searchParams.get("companyId") || null;
    const connectionId = url.searchParams.get("connectionId") || null;
    const provider = "GOOGLE_CALENDAR";

    // ======================
    // 1) Localizar conexión
    // ======================
    let conn:
      | {
          id: string;
          access_token: string | null;
          refresh_token: string | null;
          expires_at: number | null;
        }
      | null = null;

    if (connectionId) {
      // Forzar una conexión exacta
      conn = await prisma.externalConnection.findUnique({
        where: { id: connectionId },
        select: { id: true, access_token: true, refresh_token: true, expires_at: true },
      });
    } else if (companyId) {
      // Por empresa
      conn = await prisma.externalConnection.findFirst({
        where: { provider, companyId },
        orderBy: { createdAt: "desc" },
        select: { id: true, access_token: true, refresh_token: true, expires_at: true },
      });
    } else {
      // Por USUARIO (idéntico al diagnose)
      if (!session.user.email) {
        return NextResponse.json({ ok: false, error: "missing_user_email" }, { status: 400 });
      }

      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });

      if (!dbUser) {
        return NextResponse.json({ ok: false, error: "user_not_found" }, { status: 404 });
      }

      conn = await prisma.externalConnection.findUnique({
        where: { userId_provider: { userId: dbUser.id, provider } },
        select: { id: true, access_token: true, refresh_token: true, expires_at: true },
      });
    }

    if (!conn) {
      return NextResponse.json(
        { ok: false, error: "no_calendar_connection_found", note: { companyId, connectionId } },
        { status: 404 }
      );
    }

    if (!conn.access_token && !conn.refresh_token) {
      return NextResponse.json({ ok: false, error: "connection_has_no_tokens" }, { status: 401 });
    }

    // ==================================================
    // 2) Preparar cliente OAuth2 (credenciales Calendar)
    // ==================================================
    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CALENDAR_CLIENT_ID,
      process.env.GOOGLE_CALENDAR_CLIENT_SECRET
    );

    const creds: Record<string, any> = {};
    if (typeof conn.access_token === "string") creds.access_token = conn.access_token;
    if (typeof conn.refresh_token === "string") creds.refresh_token = conn.refresh_token;
    if (typeof conn.expires_at === "number") creds.expiry_date = conn.expires_at * 1000;

    client.setCredentials(creds);

    // ==========================================
    // 3) Refrescar si caduca en <= 60 segundos
    // ==========================================
    let needRefresh = false;
    if (typeof conn.expires_at === "number") {
      const nowSec = Math.floor(Date.now() / 1000);
      if (conn.expires_at <= nowSec + 60) {
        needRefresh = true;
      }
    }

    if (needRefresh && typeof conn.refresh_token === "string" && conn.refresh_token.length > 0) {
      try {
        const resp = await client.refreshAccessToken();
        const credentials = resp.credentials;

        let newAccess: string | null = null;
        if (typeof credentials.access_token === "string") newAccess = credentials.access_token;

        let newExpirySec: number | null = null;
        if (typeof credentials.expiry_date === "number") {
          newExpirySec = Math.floor(credentials.expiry_date / 1000);
        }

        const updateData: Record<string, any> = {};
        if (typeof newAccess === "string") updateData.access_token = newAccess;
        if (typeof newExpirySec === "number") updateData.expires_at = newExpirySec;

        if (Object.keys(updateData).length > 0) {
          await prisma.externalConnection.update({
            where: { id: conn.id },
            data: updateData,
          });
          // y actualizamos el cliente en memoria
          client.setCredentials({
            access_token: newAccess || conn.access_token || undefined,
            refresh_token: conn.refresh_token || undefined,
            expiry_date: (newExpirySec || conn.expires_at || 0) * 1000,
          });
        }
      } catch {
        return NextResponse.json({ ok: false, error: "refresh_failed" }, { status: 401 });
      }
    }

    // ==========================
    // 4) Llamada a Google Calendar
    // ==========================
    const calendar = google.calendar({ version: "v3", auth: client });
    const nowIso = new Date().toISOString();

    const { data } = await calendar.events.list({
      calendarId: "primary",
      timeMin: nowIso,
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
    });

    return NextResponse.json({
      ok: true,
      connectionId: conn.id, // útil para depurar/forzar después
      items: data.items ?? [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "unknown_error" },
      { status: 500 }
    );
  }
}
