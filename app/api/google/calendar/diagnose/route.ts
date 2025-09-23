import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

/**
 * Diagnóstico de conexiones de Google Calendar.
 *
 * Uso:
 *   GET /api/google/calendar/diagnose
 *   GET /api/google/calendar/diagnose?companyId=...
 *
 * No llama a Google. Solo inspecciona sesión + DB para ver:
 * - usuario de sesión (email/id)
 * - User real en DB (por email)
 * - Conexión por companyId (si se pasó)
 * - Conexión por usuario (si NO se pasó companyId)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const url = new URL(req.url);
    const companyId = url.searchParams.get("companyId") || null;
    const provider = "GOOGLE_CALENDAR";

    const out: any = {
      ok: true,
      session: {
        hasSession: Boolean(session),
        email: session?.user?.email ?? null,
        id: (session?.user as any)?.id ?? null,
      },
      companyId,
      db: {
        userByEmail: null as any,
        userConnections: [] as any[],
        companyConnections: [] as any[],
        chosenConnection: null as any,
      },
      hints: [
        "Si no hay chosenConnection, revisa provider y/o que la conexión se haya guardado con ese user/company.",
        "Si userByEmail es null, la sesión no casa con ningún User.email en DB.",
      ],
    };

    // 1) User por email de sesión
    if (session?.user?.email) {
      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, email: true },
      });
      out.db.userByEmail = dbUser ?? null;

      // 2) Conexiones del usuario (todas, para ver providers y companyId)
      if (dbUser) {
        const userConnections = await prisma.externalConnection.findMany({
          where: { userId: dbUser.id },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            provider: true,
            companyId: true,
            access_token: true,
            refresh_token: true,
            expires_at: true,
            createdAt: true,
            updatedAt: true,
          },
        });
        out.db.userConnections = userConnections.map((c) => ({
          id: c.id,
          provider: c.provider,
          companyId: c.companyId,
          hasAccessToken: Boolean(c.access_token),
          hasRefreshToken: Boolean(c.refresh_token),
          expiresAt: c.expires_at ?? null,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        }));

        // 3) Elegir conexión por usuario si no viene companyId
        if (!companyId) {
          const chosen = userConnections.find((c) => c.provider === provider);
          if (chosen) {
            out.db.chosenConnection = {
              id: chosen.id,
              provider: chosen.provider,
              companyId: chosen.companyId,
              hasAccessToken: Boolean(chosen.access_token),
              hasRefreshToken: Boolean(chosen.refresh_token),
              expiresAt: chosen.expires_at ?? null,
            };
          }
        }
      }
    }

    // 4) Si viene companyId, mirar conexiones por empresa
    if (companyId) {
      const companyConns = await prisma.externalConnection.findMany({
        where: { companyId, provider },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          provider: true,
          companyId: true,
          userId: true,
          access_token: true,
          refresh_token: true,
          expires_at: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      out.db.companyConnections = companyConns.map((c) => ({
        id: c.id,
        provider: c.provider,
        companyId: c.companyId,
        userId: c.userId,
        hasAccessToken: Boolean(c.access_token),
        hasRefreshToken: Boolean(c.refresh_token),
        expiresAt: c.expires_at ?? null,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }));

      if (companyConns.length > 0) {
        const chosen = companyConns[0];
        out.db.chosenConnection = {
          id: chosen.id,
          provider: chosen.provider,
          companyId: chosen.companyId,
          hasAccessToken: Boolean(chosen.access_token),
          hasRefreshToken: Boolean(chosen.refresh_token),
          expiresAt: chosen.expires_at ?? null,
        };
      }
    }

    // 5) Pequeñas ayudas de diagnóstico
    if (!out.db.userByEmail) {
      out.hints.push("No se encontró User por el email de sesión. ¿Estás logado con el mismo usuario que conectó?");
    }
    if (!out.db.chosenConnection) {
      out.hints.push(`No hay conexión elegida. ¿Existe una fila con provider="${provider}" para ese usuario o companyId?`);
    }

    return NextResponse.json(out);
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "unknown_error" },
      { status: 500 }
    );
  }
}
