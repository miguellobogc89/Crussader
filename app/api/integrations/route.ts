// app/api/integrations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function normalizeExpires(raw: unknown): Date | null {
  if (raw == null) return null;
  if (raw instanceof Date) return raw;
  if (typeof raw === "number") {
    const ms = raw > 1e11 ? raw : raw * 1000;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof raw === "string") {
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const url = new URL(req.url);

  const all = url.searchParams.get("all") === "1";
  const debug = url.searchParams.get("debug") === "1";

  const rawCompanyId = url.searchParams.get("companyId") ?? "";
  const rawProvider = url.searchParams.get("provider") ?? "";

  const companyId = rawCompanyId.trim();
  const provider = rawProvider.trim();

  const diag: Record<string, unknown> = {
    ok: true,
    session_email: session?.user?.email ?? null,
  };

  // Listado completo (diagnóstico)
  if (all) {
    const users = await prisma.user.findMany({ select: { id: true, email: true } });
    const connections = await prisma.externalConnection.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ ...diag, mode: "ALL", users, connections });
  }

  // Búsqueda por companyId+provider (info completa)
  if (companyId && provider) {
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
    }

    // 1) Intento exacto (case-insensitive)
    let row = await prisma.externalConnection.findFirst({
      where: {
        companyId: { equals: companyId, mode: "insensitive" },
        provider: { equals: provider, mode: "insensitive" },
      },
      select: {
        id: true,
        companyId: true,
        provider: true,
        accountEmail: true,
        access_token: true,
        refresh_token: true,
        expires_at: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    // 2) Fallback por si hay pequeñas variaciones en provider
    if (!row) {
      row = await prisma.externalConnection.findFirst({
        where: {
          companyId: { equals: companyId, mode: "insensitive" },
          OR: [
            { provider: { startsWith: provider, mode: "insensitive" } },
            { provider: { contains: provider, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          companyId: true,
          provider: true,
          accountEmail: true,
          access_token: true,
          refresh_token: true,
          expires_at: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
      });
    }

    // Estado derivado
    type State = "NONE" | "EXISTS_NO_TOKEN" | "HAS_TOKEN" | "TOKEN_EXPIRED";
    let state: State = "NONE";
    let hasToken = false;
    let tokenExpired = false;

    const expDate = normalizeExpires((row as any)?.expires_at);
    if (row) {
      const tokenLike = Boolean(row.access_token || row.refresh_token);
      hasToken = tokenLike;
      if (!tokenLike) {
        state = "EXISTS_NO_TOKEN";
      } else {
        tokenExpired = Boolean(expDate && expDate.getTime() < Date.now());
        state = tokenExpired ? "TOKEN_EXPIRED" : "HAS_TOKEN";
      }
    }

    const data = row
      ? {
          id: row.id,
          companyId: row.companyId,
          provider: row.provider,
          accountEmail: row.accountEmail ?? null,
          access_token: row.access_token ?? null,
          refresh_token: row.refresh_token ?? null,
          expires_at: expDate, // Date|null normalizado
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          state,
          hasToken,
          tokenExpired,
        }
      : null;

    if (!debug) {
      return NextResponse.json({ ...diag, mode: "BY_COMPANY_PROVIDER", data });
    }

    // Debug extra
    const sameProvider = await prisma.externalConnection.findMany({
      where: { provider: { contains: provider, mode: "insensitive" } },
      select: { id: true, companyId: true, provider: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
    });

    const sameCompany = await prisma.externalConnection.findMany({
      where: { companyId: { equals: companyId, mode: "insensitive" } },
      select: { id: true, companyId: true, provider: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
    });

    return NextResponse.json({
      ...diag,
      mode: "BY_COMPANY_PROVIDER",
      filters: { companyId, provider },
      data,
      debug_matches: { sameProvider_sample: sameProvider, sameCompany_sample: sameCompany },
    });
  }

  // Fallback por usuario (modo anterior)
  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true },
  });

  if (!user) {
    return NextResponse.json({ ...diag, mode: "BY_USER", note: "no_user_for_session_email", connections: [] });
  }

  const connections = await prisma.externalConnection.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ...diag, mode: "BY_USER", userId: user.id, connections });
}
