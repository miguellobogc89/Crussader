// app/api/responses/settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ResponseSettingsSchema } from "@/app/schemas/response-settings";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function badRequest(msg: string, extra?: any) {
  return NextResponse.json({ ok: false, error: msg, ...extra }, { status: 400 });
}

// Extrae un userId de forma defensiva, evitando errores de tipos
async function resolveUserId(req: NextRequest): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions as any);
    const sUser = (session as any)?.user;
    if (sUser && typeof sUser.id === "string" && sUser.id.trim().length > 0) {
      return sUser.id.trim();
    }
  } catch {
    // ignore
  }
  const headerUser = req.headers.get("x-user-id");
  if (headerUser && headerUser.trim().length > 0) return headerUser.trim();
  return null;
}

/**
 * GET /api/responses/settings?companyId=...
 * -> Sin cookies. Requiere companyId explícito.
 */
export async function GET(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get("companyId");
  if (!companyId) return badRequest("companyId_required");

  const row = await prisma.responseSettings.findUnique({
    where: { companyId },
    select: {
      companyId: true,
      config: true,
      createdAt: true,
      updatedAt: true,
      createdByUserId: true,
      updatedByUserId: true,
    },
  });

  return NextResponse.json({
    ok: true,
    settings: row?.config ?? null,
    meta: row
      ? {
          companyId: row.companyId,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          createdByUserId: row.createdByUserId,
          updatedByUserId: row.updatedByUserId,
        }
      : null,
  });
}

/**
 * PUT /api/responses/settings
 * Body: { companyId: string, config: ResponseSettings }
 * -> Guarda SOLO usando companyId explícito (sin cookies).
 */
export async function PUT(req: NextRequest) {
  // 0) Parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("invalid_json");
  }

  const raw = body as any;
  const companyId = typeof raw?.companyId === "string" ? raw.companyId.trim() : "";
  if (!companyId) return badRequest("companyId_required");

  // 1) Validar config con zod
  const parsed = ResponseSettingsSchema.safeParse(raw?.config);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "validation_failed", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  // 2) Resolver userId (Next-Auth o header de fallback)
  const userId = await resolveUserId(req);
  // Si en tu schema estos campos son NOT NULL, descomenta para forzar auth:
  // if (!userId) return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });

  const createdByPatch = userId ? { createdByUserId: userId } : {};
  const updatedByPatch = userId ? { updatedByUserId: userId } : {};

  // 3) Upsert
  const saved = await prisma.responseSettings.upsert({
    where: { companyId },
    create: {
      companyId,
      config: parsed.data,
      ...createdByPatch,
      ...updatedByPatch, // al crear, marcamos ambos
    },
    update: {
      config: parsed.data,
      ...updatedByPatch, // al actualizar, solo updatedBy
    },
    select: {
      companyId: true,
      config: true,
      createdAt: true,
      updatedAt: true,
      createdByUserId: true,
      updatedByUserId: true,
    },
  });

  return NextResponse.json({
    ok: true,
    settings: saved.config,
    meta: {
      companyId: saved.companyId,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
      createdByUserId: saved.createdByUserId,
      updatedByUserId: saved.updatedByUserId,
    },
  });
}
