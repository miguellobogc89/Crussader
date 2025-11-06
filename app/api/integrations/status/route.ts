// app/api/integrations/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type IntegrationStatusKey =
  | "CONNECTED"
  | "LIMITED"
  | "EXPIRED"
  | "REVOKED"
  | "SYNC_ERROR"
  | "NOT_CONNECTED";

// Normaliza a epoch segundos (acepta number | Date | string)
function toEpochSeconds(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number") return v; // ya vendría en epoch s (si tu schema lo guarda así)
  if (v instanceof Date) return Math.floor(v.getTime() / 1000);
  if (typeof v === "string") {
    const d = new Date(v);
    if (!isNaN(d.getTime())) return Math.floor(d.getTime() / 1000);
  }
  return null;
}

// Normaliza a ISO string
function toIso(v: unknown): string | null {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "number") return new Date(v * 1000).toISOString();
  if (typeof v === "string") {
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  return null;
}

function mapStatus(row: {
  access_token: string | null;
  refresh_token: string | null;
  expires_at: number | Date | string | null;
  revokedAt?: Date | string | number | null;
}): IntegrationStatusKey {
  // Revocado explícito
  const revoked = row.revokedAt != null;
  if (revoked) return "REVOKED";

  // Sin access token -> no conectado (o revocado previamente)
  if (!row.access_token) return "NOT_CONNECTED";

  // Caducidad
  const now = Math.floor(Date.now() / 1000);
  const exp = toEpochSeconds(row.expires_at);
  if (exp != null && exp <= now) return "EXPIRED";

  // Sin refresh token -> funcionalidad limitada
  if (!row.refresh_token) return "LIMITED";

  return "CONNECTED";
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const companyId = url.searchParams.get("companyId");
    const provider = url.searchParams.get("provider");

    if (!companyId || !provider) {
      return NextResponse.json(
        { ok: false, error: "MISSING_PARAMS", hint: "companyId & provider required" },
        { status: 400 }
      );
    }

    // Selección mínima y segura (evita traer tipos raros)
    const row = await prisma.externalConnection.findFirst({
      where: { companyId, provider },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        provider: true,
        companyId: true,
        accountEmail: true,
        accountName: true,
        updatedAt: true,               // Date
        access_token: true,            // string | null
        refresh_token: true,           // string | null
        expires_at: true,              // number | Date | string | null (depende de tu schema)
        // si tu schema no tiene revokedAt, no pasa nada: será undefined
        // @ts-ignore
        revokedAt: true,
        // @ts-ignore (por si se llama revoked_at)
        revoked_at: true,
      },
    });

    if (!row) {
      return NextResponse.json({
        ok: true,
        exists: false,
        status: "NOT_CONNECTED" as IntegrationStatusKey,
      });
    }

    const revokedAt = (row as any).revokedAt ?? (row as any).revoked_at ?? null;

    const status = mapStatus({
      access_token: row.access_token,
      refresh_token: row.refresh_token,
      expires_at: row.expires_at,
      revokedAt,
    });

    const updatedAtIso = toIso(row.updatedAt);
    const expiresAtIso = toIso(row.expires_at);

    return NextResponse.json({
      ok: true,
      exists: true,
      status,
      updatedAt: updatedAtIso,
      expiresAt: expiresAtIso,
      accountEmail: row.accountEmail ?? null,
      accountName: row.accountName ?? null,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR", detail: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
