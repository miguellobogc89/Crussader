// app/api/notifications/unread-count/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email ?? null;

    if (!email) {
      return NextResponse.json({ ok: true, count: 0 });
    }

    // 1) Usuario actual
    const me = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!me) {
      return NextResponse.json({ ok: true, count: 0 });
    }

    // 2) Companies del usuario y sus account_id
    const userCompanies = await prisma.userCompany.findMany({
      where: { userId: me.id },
      select: {
        Company: {
          select: { account_id: true },
        },
      },
    });

    const accountIds = Array.from(
      new Set(
        userCompanies
          .map((uc) => uc.Company?.account_id)
          .filter((v): v is string => !!v),
      ),
    );

    if (!accountIds.length) {
      return NextResponse.json({ ok: true, count: 0 });
    }

    // 3) Notificaciones unread de esas accounts
    const count = await prisma.notification.count({
      where: {
        status: "unread",
        accountId: { in: accountIds },
      },
    });

    return NextResponse.json({ ok: true, count });
  } catch (err) {
    console.error("[GET /api/notifications/unread-count] error:", err);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
