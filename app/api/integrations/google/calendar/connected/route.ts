// app/api/integrations/google/calendar/connected/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json(
      { ok: false, error: "not_authenticated" },
      { status: 401 }
    );
  }

  const url = new URL(req.url);
  const companyId = url.searchParams.get("companyId");

  if (!companyId) {
    return NextResponse.json(
      { ok: false, error: "missing_company_id" },
      { status: 400 }
    );
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!dbUser) {
    return NextResponse.json(
      { ok: false, error: "user_not_found" },
      { status: 404 }
    );
  }

  const connection = await prisma.externalConnection.findUnique({
    where: {
      userId_provider: {
        userId: dbUser.id,
        provider: "google-calendar",
      },
    },
    select: {
      id: true,
      accountEmail: true,
    },
  });

  if (!connection) {
    return NextResponse.json({
      ok: true,
      calendars: [],
    });
  }

  const calendars = await prisma.external_calendar.findMany({
    where: {
      connection_id: connection.id,
      company_id: companyId,
      provider: "google-calendar",
      active: true,
      purpose: {
        in: ["crussader_mirror", "google_context"],
      }
    },
    orderBy: {
      created_at: "asc",
    },
    select: {
      id: true,
      external_calendar_id: true,
      name: true,
      timezone: true,
      purpose: true,
      access_role: true,
      is_primary: true,
      is_app_created: true,
      updated_at: true,
      background_color: true,
      foreground_color: true,
      color_id: true,
    },
  });

  return NextResponse.json({
    ok: true,
    calendars: calendars.map((calendar) => {
      return {
        id: calendar.id,
        external_calendar_id: calendar.external_calendar_id,
        external_calendar_name: calendar.name,
        external_account_email: connection.accountEmail,
        last_synced_at: calendar.updated_at,
        purpose: calendar.purpose,
        access_role: calendar.access_role,
        is_primary: calendar.is_primary,
        is_app_created: calendar.is_app_created,
        background_color: calendar.background_color,
        foreground_color: calendar.foreground_color,
        color_id: calendar.color_id,
      };
    }),
  });
}