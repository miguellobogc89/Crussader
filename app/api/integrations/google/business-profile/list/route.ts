// app/api/integrations/google/business-profile/list/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/app/server/db";

type Status = "NOT_CONNECTED" | "CONNECTED" | "EXPIRED";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!session || !userId) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    // Company activa del usuario
    const userCompany = await prisma.userCompany.findFirst({
      where: { userId },
      select: { companyId: true },
    });

    if (!userCompany?.companyId) {
      return NextResponse.json({ ok: false, error: "NO_COMPANY" }, { status: 404 });
    }

    const companyId = userCompany.companyId;

    // Última conexión de Google asociada a la company (puede haber varias por usuarios)
    const conn = await prisma.externalConnection.findFirst({
      where: { provider: "google", companyId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        userId: true,
        provider: true,
        accountEmail: true,
        accountName: true,
        providerUserId: true,
        scope: true,
        expires_at: true,
        createdAt: true,
        updatedAt: true,
        companyId: true,
      },
    });

    let status: Status = "NOT_CONNECTED";
    if (conn) {
      if (conn.expires_at && Number.isFinite(conn.expires_at)) {
        const now = Math.floor(Date.now() / 1000);
        status = conn.expires_at <= now ? "EXPIRED" : "CONNECTED";
      } else {
        status = "CONNECTED";
      }
    }

    return NextResponse.json({
      ok: true,
      data: conn
        ? {
            status,
            id: conn.id,
            provider: conn.provider,
            accountEmail: conn.accountEmail,
            accountName: conn.accountName,
            providerUserId: conn.providerUserId,
            scope: conn.scope,
            expiresAt: conn.expires_at ?? null,
            updatedAt: conn.updatedAt,
            createdAt: conn.createdAt,
            companyId: conn.companyId,
            // opcional: quién conectó
            userId: conn.userId,
          }
        : {
            status: "NOT_CONNECTED" as Status,
            provider: "google",
            companyId,
          },
    });
  } catch (err) {
    console.error("GET /api/integrations/google/connection error", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
