import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const url = new URL(req.url);
  const all = url.searchParams.get("all") === "1";

  // Diagnóstico base
  const diag: Record<string, unknown> = {
    ok: true,
    session_email: session?.user?.email ?? null,
  };

  if (all) {
    // DEV: listar todo para verificar por qué tu tabla sale vacía
    const users = await prisma.user.findMany({ select: { id: true, email: true } });
    const connections = await prisma.externalConnection.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ ...diag, mode: "ALL", users, connections });
  }

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
