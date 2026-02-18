// app/api/admin/leads/[id]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

const ALLOWED = ["NEW", "CONTACTED", "QUALIFIED", "LOST", "WON"] as const;

function assertAdminRole(session: any) {
  const role = session?.user?.role;
  if (role !== "system_admin" && role !== "org_admin") {
    return NextResponse.json(
      { ok: false, code: "FORBIDDEN_ROLE", message: "Sin permisos." },
      { status: 403 }
    );
  }
  return null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { ok: false, code: "UNAUTHORIZED", message: "No autenticado." },
      { status: 401 }
    );
  }
  const forbidden = assertAdminRole(session);
  if (forbidden) return forbidden;

  const body = await req.json().catch(() => null);
  const statusRaw = (body?.status || "").toString().toUpperCase();

  if (!ALLOWED.includes(statusRaw as any)) {
    return NextResponse.json(
      { ok: false, code: "INVALID_STATUS", message: "Estado inválido." },
      { status: 400 }
    );
  }

  const lead = await prisma.lead.update({
    where: { id: params.id },
    data: { status: statusRaw as any },
    select: { id: true, status: true, updatedAt: true },
  });

  return NextResponse.json({ ok: true, lead });
}
