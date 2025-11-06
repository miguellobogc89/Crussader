// app/api/integrations/google/calendar/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { google } from "googleapis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 1) Sesión
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
    }

    // 2) User real por email (igual que en /list)
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!dbUser) {
      return NextResponse.json({ ok: false, error: "user_not_found" }, { status: 404 });
    }

    // 3) Conexión de calendar del usuario
    const provider = "GOOGLE_CALENDAR";
    const conn = await prisma.externalConnection.findUnique({
      where: { userId_provider: { userId: dbUser.id, provider } },
      select: { id: true, access_token: true, refresh_token: true, expires_at: true },
    });
    if (!conn) {
      return NextResponse.json({ ok: false, error: "no_calendar_connection_found" }, { status: 404 });
    }
    if (!conn.access_token && !conn.refresh_token) {
      return NextResponse.json({ ok: false, error: "connection_has_no_tokens" }, { status: 401 });
    }

    // 4) Leer body (esperamos el formato que envía tu page: { summary, start:{...}, end:{...} })
    const body = await req.json();
    const summary = typeof body.summary === "string" ? body.summary : "Evento sin título";
    const start = body.start;
    const end = body.end;

    if (!start || !end) {
      return NextResponse.json({ ok: false, error: "missing_start_or_end" }, { status: 400 });
    }

    // 5) Cliente OAuth2 + posible refresh
    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CALENDAR_CLIENT_ID,
      process.env.GOOGLE_CALENDAR_CLIENT_SECRET
    );
    client.setCredentials({
      access_token: conn.access_token || undefined,
      refresh_token: conn.refresh_token || undefined,
      expiry_date: typeof conn.expires_at === "number" ? conn.expires_at * 1000 : undefined,
    });

    // refresh si caduca en <=60s
    const needRefresh =
      typeof conn.expires_at === "number" &&
      conn.expires_at <= Math.floor(Date.now() / 1000) + 60;

    if (needRefresh && conn.refresh_token) {
      try {
        const { credentials } = await client.refreshAccessToken();
        const newAccess = credentials.access_token;
        const newExpiry = typeof credentials.expiry_date === "number"
          ? Math.floor(credentials.expiry_date / 1000)
          : null;

        const update: any = {};
        if (typeof newAccess === "string") update.access_token = newAccess;
        if (typeof newExpiry === "number") update.expires_at = newExpiry;

        if (Object.keys(update).length > 0) {
          await prisma.externalConnection.update({ where: { id: conn.id }, data: update });
          client.setCredentials({
            access_token: newAccess || conn.access_token || undefined,
            refresh_token: conn.refresh_token || undefined,
            expiry_date: (newExpiry || conn.expires_at || 0) * 1000,
          });
        }
      } catch {
        return NextResponse.json({ ok: false, error: "refresh_failed" }, { status: 401 });
      }
    }

    // 6) Insertar en Calendar
    const calendar = google.calendar({ version: "v3", auth: client });

    const eventResource: any = { summary };
    // acepta tanto { date } (all-day) como { dateTime } (con horas)
    eventResource.start = start;
    eventResource.end = end;

    const insert = await calendar.events.insert({
      calendarId: "primary",
      requestBody: eventResource,
      // sendUpdates: "all", // (opcional) para enviar invitaciones si hay attendees
    });

    const created = insert.data;
    return NextResponse.json({
      ok: true,
      connectionUsed: conn.id,
      id: created.id || null,
      htmlLink: created.htmlLink || null,
      start: created.start || null,
      end: created.end || null,
      summary: created.summary || summary,
    });
  } catch (err: any) {
    console.error("[Calendar Create] Error:", err);
    return NextResponse.json({ ok: false, error: err?.message || "unknown_error" }, { status: 500 });
  }
}

// (opcional) mantenemos el GET de ping para testear la ruta en el navegador
export async function GET() {
  return NextResponse.json({ ok: true, ping: "create-get" });
}
