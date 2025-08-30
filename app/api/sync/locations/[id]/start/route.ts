// app/api/sync/locations/[id]/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { CompanyRole } from "@prisma/client";

// ⚠️ En el siguiente paso creamos esto:
import { runFlashSync } from "@/app/lib/sync/runFlashSync";

export const dynamic = "force-dynamic";

async function ensureAccess(email: string | null, locationId: string) {
  if (!email) return { ok: false as const, status: 401, error: "unauth" };

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });
  if (!user) return { ok: false as const, status: 401, error: "no_user" };

  // system_admin ve todo
  if ((user as any).role === "system_admin") return { ok: true as const, userId: user.id };

  const location = await prisma.location.findUnique({
    where: { id: locationId },
    select: { companyId: true },
  });
  if (!location) return { ok: false as const, status: 404, error: "not_found" };

  const membership = await prisma.userCompany.findFirst({
    where: {
      userId: user.id,
      companyId: location.companyId,
      role: { in: [CompanyRole.OWNER, CompanyRole.ADMIN, CompanyRole.MEMBER] },
    },
    select: { id: true },
  });
  if (!membership) return { ok: false as const, status: 403, error: "forbidden" };

  return { ok: true as const, userId: user.id };
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } // 👈 Next 15: params es Promise
) {
  try {
    const { id } = await context.params; // 👈 await del params

    const session = await getServerSession(authOptions);
    const guard = await ensureAccess(session?.user?.email ?? null, id);
    if (!guard.ok) {
      return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
    }

    const url = new URL(req.url);
    const mode = url.searchParams.get("mode") ?? "flash";

    if (mode !== "flash" && mode !== "full") {
      return NextResponse.json({ ok: false, error: "invalid_mode" }, { status: 400 });
    }

    if (mode === "flash") {
      // ✅ sincronización inicial inmediata (ventana corta)
      const result = await runFlashSync({
        locationId: id,
        windowMonths: 12,
        maxReviews: 200,
      });
      return NextResponse.json({ ok: true, mode, imported: result.imported, info: result.info });
    }

    // (futuro) modo full: orquestar histórico completo
    // Por ahora, devolvemos 202 para no bloquear
    // TODO: encolar job y devolver id de tarea
    return NextResponse.json({ ok: true, mode: "full", queued: true }, { status: 202 });
  } catch (e: any) {
    console.error("[POST /api/sync/locations/:id/start] ", e);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
