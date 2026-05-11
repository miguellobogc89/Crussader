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
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const url = new URL(req.url);
  const companyId = url.searchParams.get("companyId");

  if (!companyId) {
    return NextResponse.json({ ok: false, error: "missing_company_id" }, { status: 400 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!dbUser) {
    return NextResponse.json({ ok: false, error: "user_not_found" }, { status: 404 });
  }

  const calendars = await prisma.external_calendar_connection.findMany({
    where: {
      user_id: dbUser.id,
      company_id: companyId,
      provider: "google-calendar",
      sync_enabled: true,
    },
    orderBy: {
      created_at: "asc",
    },
    select: {
      id: true,
      external_calendar_id: true,
      external_calendar_name: true,
      external_account_email: true,
      last_synced_at: true,
    },
  });

  return NextResponse.json({
    ok: true,
    calendars,
  });
}