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

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { ok: false, code: "UNAUTHORIZED", message: "No autenticado." },
      { status: 401 }
    );
  }
  const forbidden = assertAdminRole(session);
  if (forbidden) return forbidden;

  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      status: true,
      type: true,
      source: true,
      rating: true,
      reviewCount: true,
      city: true,
      category: true,
      website: true,
      mapsUrl: true,
      placeId: true,
      createdAt: true,
      updatedAt: true,
      lastContactAt: true,
      nextFollowUpAt: true,
    },
  });

  return NextResponse.json({ ok: true, leads });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { ok: false, code: "UNAUTHORIZED", message: "Debes iniciar sesión." },
      { status: 401 }
    );
  }
  const forbidden = assertAdminRole(session);
  if (forbidden) return forbidden;

  const body = await req.json().catch(() => null);

  const email = body?.email as string | undefined;
  const name = body?.name as string | undefined;
  const type = body?.type as string | undefined;

  const phone = body?.phone as string | undefined;
  const website = body?.website as string | undefined;
  const mapsUrl = body?.mapsUrl as string | undefined;
  const placeId = body?.placeId as string | undefined;
  const city = body?.city as string | undefined;
  const category = body?.category as string | undefined;

  const ratingRaw = body?.rating as number | string | undefined;
  const reviewCountRaw = body?.reviewCount as number | string | undefined;

  if (!email) {
    return NextResponse.json(
      { ok: false, code: "MISSING_EMAIL", message: "Debes indicar un email." },
      { status: 400 }
    );
  }
  if (!name) {
    return NextResponse.json(
      { ok: false, code: "MISSING_NAME", message: "Debes indicar el nombre." },
      { status: 400 }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = name.trim();
  const userId = (session.user as any).id as string;

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });
  if (existingUser) {
    return NextResponse.json(
      {
        ok: false,
        code: "USER_ALREADY_EXISTS",
        message: "Ya existe un usuario con ese email.",
        context: { userId: existingUser.id, email: normalizedEmail },
      },
      { status: 409 }
    );
  }

  const userCompany = await prisma.userCompany.findFirst({
    where: { userId },
    select: { companyId: true },
  });
  if (!userCompany) {
    return NextResponse.json(
      {
        ok: false,
        code: "NO_COMPANY_FOR_USER",
        message: "El usuario actual no tiene compañía asociada.",
      },
      { status: 400 }
    );
  }

  const upperType = (type || "TEST_USER").toString().toUpperCase();
  const leadType = LEAD_TYPES.includes(upperType as any)
    ? (upperType as (typeof LEAD_TYPES)[number])
    : "OTHER";

  const existingLead = await prisma.lead.findFirst({
    where: { email: normalizedEmail },
    orderBy: { createdAt: "desc" },
    select: { id: true, status: true, type: true, createdAt: true },
  });
  if (existingLead) {
    return NextResponse.json(
      {
        ok: false,
        code: "LEAD_ALREADY_EXISTS",
        message: "Ya existe un lead con ese email.",
        context: existingLead,
      },
      { status: 409 }
    );
  }

  const existingInvite = await prisma.invite.findFirst({
    where: {
      email: normalizedEmail,
      status: "PENDING" as any,
      used_count: 0,
      max_uses: 1,
      OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
    },
    orderBy: { created_at: "desc" },
    select: { id: true, code: true, expires_at: true },
  });
  if (existingInvite) {
    return NextResponse.json(
      {
        ok: false,
        code: "INVITE_ALREADY_ACTIVE",
        message: "Ya existe una invitación activa para este email.",
        context: {
          inviteId: existingInvite.id,
          code: existingInvite.code,
          expiresAt: existingInvite.expires_at,
        },
      },
      { status: 409 }
    );
  }

  const rating =
    ratingRaw === undefined || ratingRaw === null || ratingRaw === ""
      ? null
      : Number(ratingRaw);

  const reviewCount =
    reviewCountRaw === undefined || reviewCountRaw === null || reviewCountRaw === ""
      ? null
      : Number(reviewCountRaw);

  try {
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
          phone: phone || null,
          website: website || null,
          mapsUrl: mapsUrl || null,
          placeId: placeId || null,
          city: city || null,
          category: category || null,
          rating: rating === null || Number.isNaN(rating) ? null : rating,
          reviewCount: reviewCount === null || Number.isNaN(reviewCount) ? null : reviewCount,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          type: true,
          rating: true,
          reviewCount: true,
          city: true,
          category: true,
          website: true,
          mapsUrl: true,
          placeId: true,
          createdAt: true,
        },
      });

      const code = await generateUniqueInviteCode();
      const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

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
            note: "Beta cerrada",
          },
        },
        select: { id: true, code: true, expires_at: true, lead_id: true },
      });

      return { lead, invite };
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.crussader.com";
    const url = `${baseUrl}/beta/register?code=${encodeURIComponent(result.invite.code)}`;

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
        message: "Lead e invitación creados.",
        lead: result.lead,
        invite: result.invite,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error creando lead/invite:", err);
    return NextResponse.json(
      { ok: false, code: "INTERNAL_ERROR", message: "Error interno." },
      { status: 500 }
    );
  }
}
