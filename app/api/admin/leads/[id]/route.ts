// app/api/admin/leads/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

const ALLOWED_STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "LOST", "WON"] as const;

function isAllowedStatus(x: any): x is (typeof ALLOWED_STATUSES)[number] {
  return ALLOWED_STATUSES.includes(x);
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { ok: false as const, res: NextResponse.json(
      { ok: false, code: "UNAUTHORIZED", message: "No autenticado." },
      { status: 401 }
    ) };
  }

  const role = (session.user as any).role;
  if (role !== "system_admin" && role !== "org_admin") {
    return { ok: false as const, res: NextResponse.json(
      { ok: false, code: "FORBIDDEN_ROLE", message: "Sin permisos." },
      { status: 403 }
    ) };
  }

  return { ok: true as const, session };
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;

  const { id } = await ctx.params;

  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) {
    return NextResponse.json(
      { ok: false, code: "NOT_FOUND", message: "Lead no encontrado." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, lead });
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;

  const { id } = await ctx.params;

  const body = await req.json().catch(() => null);
  const status = body?.status;

  if (!isAllowedStatus(status)) {
    return NextResponse.json(
      {
        ok: false,
        code: "INVALID_STATUS",
        message: "Estado inválido.",
      },
      { status: 400 }
    );
  }

  const lead = await prisma.lead.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json({ ok: true, lead });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;

  const { id } = await ctx.params;

  // Borra primero children si tienes FK (por ejemplo lead_interaction / invites)
  await prisma.invite.deleteMany({ where: { lead_id: id } }).catch(() => null);
  await prisma.lead_interaction.deleteMany({ where: { lead_id: id } }).catch(() => null);

  await prisma.lead.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
