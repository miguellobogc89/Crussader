// app/api/integrations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const url = new URL(req.url);
  const all = url.searchParams.get("all") === "1";

  // Parámetros para modo "find by company+provider"
  const companyId = url.searchParams.get("companyId") ?? "";
  const provider  = url.searchParams.get("provider") ?? "";

  // Diagnóstico base
  const diag: Record<string, unknown> = {
    ok: true,
    session_email: session?.user?.email ?? null,
  };

  // ─────────────────────────────────────────────
  // MODO: listar TODO (solo dev/diagnóstico)
  // ─────────────────────────────────────────────
  if (all) {
    const users = await prisma.user.findMany({ select: { id: true, email: true } });
    const connections = await prisma.externalConnection.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ ...diag, mode: "ALL", users, connections });
  }

  // ─────────────────────────────────────────────
  // MODO: buscar por companyId+provider (id directo)
  // GET /api/integrations?companyId=...&provider=google-business
  // ─────────────────────────────────────────────
  if (companyId && provider) {
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
    }

    const row = await prisma.externalConnection.findFirst({
      where: {
        companyId,
        provider, // Debe coincidir EXACTAMENTE con el valor guardado en DB, p.ej. "google-business"
      },
      select: { id: true, companyId: true, provider: true, updatedAt: true },
    });

    // Devolvemos null si no existe para que el cliente lo maneje de forma limpia
    return NextResponse.json({
      ...diag,
      mode: "BY_COMPANY_PROVIDER",
      data: row ? { id: row.id, companyId: row.companyId, provider: row.provider } : null,
    });
  }

  // ─────────────────────────────────────────────
  // MODO: por usuario de sesión (comportamiento anterior)
  // ─────────────────────────────────────────────
  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  // Buscar el user de la sesión
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true },
  });

  if (!user) {
    return NextResponse.json({
      ...diag,
      mode: "BY_USER",
      note: "no_user_for_session_email",
      connections: [],
    });
  }

  // Conexiones por userId
  const connections = await prisma.externalConnection.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    ...diag,
    mode: "BY_USER",
    userId: user.id,
    connections,
  });
}
