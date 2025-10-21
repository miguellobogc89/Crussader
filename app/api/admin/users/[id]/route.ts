// app/api/admin/users/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

// --- helpers de autorización ---
async function requireSystemAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Response("UNAUTHORIZED", { status: 401 });
  }
  const me = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!me || me.role !== "system_admin") {
    throw new Response("FORBIDDEN", { status: 403 });
  }
  return me;
}

function parseDateOrNull(v: unknown): Date | null {
  if (typeof v === "string" && v.trim()) {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

const ALLOWED_ROLES = new Set(["system_admin", "org_admin", "user", "test"] as const);

// ===== GET /api/admin/users/:id  -> detalle completo =====
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireSystemAdmin();
    const id = params.id;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        deactivatedAt: true,
        failedLoginCount: true,
        isActive: true,
        isSuspended: true,
        suspendedAt: true,
        suspendedReason: true,
        lastLoginAt: true,
        lastSeenAt: true,
        locale: true,
        loginCount: true,
        marketingOptIn: true,
        notes: true,
        passwordHash: true, // no mostrar en UI
        phone: true,
        privacyAcceptedAt: true,
        termsAcceptedAt: true,
        timezone: true,
      },
    });
    if (!user) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    return NextResponse.json({ ok: true, user });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return NextResponse.json({ ok: false, error: e?.message ?? "GET_USER_ERROR" }, { status: 500 });
  }
}

// ===== PATCH /api/admin/users/:id  -> edición amplia =====
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireSystemAdmin();
    const id = params.id;
    const body = await req.json();

    const data: any = {};

    if (typeof body.name === "string") data.name = body.name;
    if (typeof body.image === "string") data.image = body.image;
    if (typeof body.phone === "string") data.phone = body.phone;
    if (typeof body.notes === "string") data.notes = body.notes;

    if (typeof body.locale === "string") data.locale = body.locale;
    if (typeof body.timezone === "string") data.timezone = body.timezone;

    if (typeof body.marketingOptIn === "boolean") data.marketingOptIn = body.marketingOptIn;

    if (typeof body.isActive === "boolean") data.isActive = body.isActive;

    if (typeof body.isSuspended === "boolean") {
      data.isSuspended = body.isSuspended;
      data.suspendedAt = body.isSuspended ? new Date() : null;
    }
    if (typeof body.suspendedReason === "string") data.suspendedReason = body.suspendedReason;

    if (typeof body.email === "string" && body.email.trim()) {
      data.email = body.email.trim();
    }

    if (typeof body.role === "string" && ALLOWED_ROLES.has(body.role)) {
      data.role = body.role;
    }

    // Fechas opcionales
    const emailVerified = parseDateOrNull(body.emailVerified);
    if (emailVerified !== null) data.emailVerified = emailVerified;

    const privacyAcceptedAt = parseDateOrNull(body.privacyAcceptedAt);
    if (privacyAcceptedAt !== null) data.privacyAcceptedAt = privacyAcceptedAt;

    const termsAcceptedAt = parseDateOrNull(body.termsAcceptedAt);
    if (termsAcceptedAt !== null) data.termsAcceptedAt = termsAcceptedAt;

    // Reset password opcional
    if (typeof body.newPassword === "string" && body.newPassword.length >= 6) {
      const salt = await bcrypt.genSalt(10);
      data.passwordHash = await bcrypt.hash(body.newPassword, salt);
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        isSuspended: true,
        suspendedAt: true,
        suspendedReason: true,
        updatedAt: true,
        locale: true,
        timezone: true,
        phone: true,
        notes: true,
        emailVerified: true,
        privacyAcceptedAt: true,
        termsAcceptedAt: true,
      },
    });

    // Log opcional de eventos de estado
    if (typeof body.isSuspended === "boolean") {
      await prisma.userStatusEvent.create({
        data: {
          userId: id,
          type: body.isSuspended ? "SUSPENDED" : "REACTIVATED",
          reason: typeof body.reason === "string" ? body.reason : null,
        },
      });
    }

    return NextResponse.json({ ok: true, user: updated });
  } catch (e: any) {
    if (e instanceof Response) return e;
    if (e?.code === "P2002") {
      // probablemente email duplicado
      return NextResponse.json({ ok: false, error: "EMAIL_ALREADY_EXISTS" }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: e?.message ?? "PATCH_USER_ERROR" }, { status: 500 });
  }
}

// ===== DELETE /api/admin/users/:id  -> igual que tu versión, con guardas =====
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireSystemAdmin();
    const id = params.id;

    if ((admin as any).id === id) {
      return NextResponse.json({ ok: false, error: "CANNOT_DELETE_SELF" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ ok: true }); // idempotente

    await prisma.$transaction(async (tx) => {
      await tx.response.updateMany({ where: { createdById: id }, data: { createdById: null } });
      await tx.response.updateMany({ where: { editedById: id }, data: { editedById: null } });

      await tx.authAccount.deleteMany({ where: { userId: id } });
      await tx.session.deleteMany({ where: { userId: id } });
      await tx.userCompany.deleteMany({ where: { userId: id } });
      await tx.userLogin.deleteMany({ where: { userId: id } });
      await tx.userStatusEvent.deleteMany({ where: { userId: id } });
      await tx.externalConnection.deleteMany({ where: { userId: id } });

      if (user.email) {
        await tx.verificationToken.deleteMany({ where: { identifier: user.email } });
      }

      await tx.user.delete({ where: { id } });
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return NextResponse.json({ ok: false, error: e?.message ?? "DELETE_USER_ERROR" }, { status: 500 });
  }
}
