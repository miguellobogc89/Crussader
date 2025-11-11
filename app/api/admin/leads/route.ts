// app/api/admin/leads/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendBetaInviteEmail } from "@/lib/email";

const LEAD_TYPES = ["TEST_USER", "BETA", "CUSTOMER", "PARTNER", "OTHER"] as const;

function generateInviteCode() {
  const n = crypto.randomInt(0, 1_000_000); // 0–999999
  return n.toString().padStart(6, "0");
}

async function generateUniqueInviteCode() {
  for (let i = 0; i < 5; i++) {
    const code = generateInviteCode();
    const exists = await prisma.invite.findUnique({ where: { code } });
    if (!exists) return code;
  }
  throw new Error("NO_UNIQUE_CODE");
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { ok: false, code: "UNAUTHORIZED", message: "No autenticado." },
      { status: 401 }
    );
  }

  const role = (session.user as any).role;
  if (role !== "system_admin" && role !== "org_admin") {
    return NextResponse.json(
      { ok: false, code: "FORBIDDEN_ROLE", message: "Sin permisos para ver leads." },
      { status: 403 }
    );
  }

  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, leads });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { ok: false, code: "UNAUTHORIZED", message: "Debes iniciar sesión para crear leads." },
      { status: 401 }
    );
  }

  const role = (session.user as any).role;
  if (role !== "system_admin" && role !== "org_admin") {
    return NextResponse.json(
      { ok: false, code: "FORBIDDEN_ROLE", message: "No tienes permisos para crear leads." },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const email = body?.email as string | undefined;
  const name = body?.name as string | undefined;
  const type = body?.type as string | undefined;

  if (!email) {
    return NextResponse.json(
      { ok: false, code: "MISSING_EMAIL", message: "Debes indicar un correo electrónico." },
      { status: 400 }
    );
  }

  if (!name) {
    return NextResponse.json(
      { ok: false, code: "MISSING_NAME", message: "Debes indicar el nombre del lead." },
      { status: 400 }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = name.trim();
  const userId = (session.user as any).id as string;

  // 1) Si ya existe un usuario con ese email → no crear lead ni invite
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, name: true },
  });

  if (existingUser) {
    return NextResponse.json(
      {
        ok: false,
        code: "USER_ALREADY_EXISTS",
        message:
          "Ya existe un usuario registrado con este email. No se ha creado un nuevo lead ni invitación.",
        context: {
          userId: existingUser.id,
          email: normalizedEmail,
        },
      },
      { status: 409 }
    );
  }

  // 2) Compañía del usuario que crea el lead
  const userCompany = await prisma.userCompany.findFirst({
    where: { userId },
    select: { companyId: true },
  });

  if (!userCompany) {
    return NextResponse.json(
      {
        ok: false,
        code: "NO_COMPANY_FOR_USER",
        message:
          "El usuario actual no tiene compañía asociada. Asigna una compañía antes de crear leads.",
      },
      { status: 400 }
    );
  }

  const upperType = (type || "TEST_USER").toString().toUpperCase();
  const leadType = LEAD_TYPES.includes(upperType as any)
    ? (upperType as (typeof LEAD_TYPES)[number])
    : "OTHER";

  // 3) ¿Ya existe un lead para este email?
  const existingLead = await prisma.lead.findFirst({
    where: { email: normalizedEmail },
    orderBy: { createdAt: "desc" },
  });

  if (existingLead) {
    return NextResponse.json(
      {
        ok: false,
        code: "LEAD_ALREADY_EXISTS",
        message:
          "Ya existe un lead registrado con este email. Revisa el lead existente antes de crear uno nuevo.",
        context: {
          leadId: existingLead.id,
          status: existingLead.status,
          type: existingLead.type,
          createdAt: existingLead.createdAt,
        },
      },
      { status: 409 }
    );
  }

  // 4) ¿Hay ya una invitación activa para este email?
  const existingInvite = await prisma.invite.findFirst({
    where: {
      email: normalizedEmail,
      status: "PENDING" as any,
      used_count: 0,
      max_uses: 1,
      OR: [
        { expires_at: null },
        { expires_at: { gt: new Date() } },
      ],
    },
    orderBy: { created_at: "desc" },
  });

  if (existingInvite) {
    return NextResponse.json(
      {
        ok: false,
        code: "INVITE_ALREADY_ACTIVE",
        message:
          "Ya existe una invitación activa para este email. Utiliza ese código en lugar de generar otro.",
        context: {
          inviteId: existingInvite.id,
          code: existingInvite.code,
          expiresAt: existingInvite.expires_at,
        },
      },
      { status: 409 }
    );
  }

  try {
    // 5) Crear Lead + Invite en transacción
    const result = await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.create({
        data: {
          companyId: userCompany.companyId,
          ownerId: userId,
          email: normalizedEmail,
          name: normalizedName,
          type: leadType,
          source: "OTHER",
          status: "NEW",
        },
      });

      const code = await generateUniqueInviteCode();
      const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 días

      const invite = await tx.invite.create({
        data: {
          code,
          email: normalizedEmail,
          lead_id: lead.id,
          invited_by_id: userId,
          max_uses: 1,
          used_count: 0,
          status: "PENDING" as any,
          expires_at: expiresAt,
          meta: {
            leadType,
            note: "Beta cerrada test user",
          },
        },
      });

      return { lead, invite };
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://app.crussader.com";
    const url = `${baseUrl}/beta/register?code=${encodeURIComponent(
      result.invite.code
    )}`;

    // 6) Email invitación usando plantilla centralizada
    await sendBetaInviteEmail({
      to: normalizedEmail,
      name: normalizedName,
      code: result.invite.code,
      url,
    });

    return NextResponse.json(
      {
        ok: true,
        code: "LEAD_AND_INVITE_CREATED",
        message: "Lead e invitación creados correctamente.",
        lead: result.lead,
        invite: result.invite,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error creando lead/invite:", err);
    return NextResponse.json(
      {
        ok: false,
        code: "INTERNAL_ERROR",
        message:
          "No se ha podido crear el lead o la invitación. Revisa los logs para más detalles.",
      },
      { status: 500 }
    );
  }
}
