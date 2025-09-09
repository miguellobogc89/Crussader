// app/api/companies/[id]/response-settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getUserAuth, assertCompanyMember } from "@/lib/authz";
import { ResponseSettingsSchema } from "@/app/schemas/response-settings";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { userId, isAdmin } = await getUserAuth();
  await assertCompanyMember(id, userId, isAdmin);

  const row = await prisma.responseSettings.findUnique({
    where: { companyId: id },
    select: { config: true, updatedAt: true, updatedByUserId: true },
  });

  let updatedBy: { id?: string; name?: string | null; email?: string | null } | null = null;
  if (row?.updatedByUserId) {
    const u = await prisma.user.findUnique({
      where: { id: row.updatedByUserId },
      select: { id: true, name: true, email: true },
    });
    updatedBy = u ?? null;
  }

  return NextResponse.json({
    ok: true,
    settings: row?.config ?? null,
    meta: row ? { updatedAt: row.updatedAt, updatedBy } : null,
  });
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { userId, isAdmin } = await getUserAuth();
  await assertCompanyMember(id, userId, isAdmin);

  const body = await req.json();
  const parsed = ResponseSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_config" }, { status: 400 });
  }

  const saved = await prisma.responseSettings.upsert({
    where: { companyId: id },
    create: {
      companyId: id,
      config: parsed.data,
      createdByUserId: userId,
      updatedByUserId: userId,
    },
    update: { config: parsed.data, updatedByUserId: userId },
    select: { config: true, updatedAt: true, updatedByUserId: true },
  });

  const u = await prisma.user.findUnique({
    where: { id: saved.updatedByUserId ?? undefined },
    select: { id: true, name: true, email: true },
  });

  return NextResponse.json({
    ok: true,
    settings: saved.config,
    meta: { updatedAt: saved.updatedAt, updatedBy: u ?? null },
  });
}
