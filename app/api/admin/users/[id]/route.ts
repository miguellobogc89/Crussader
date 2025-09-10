// app/api/admin/users/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

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

// PATCH /api/admin/users/:id  -> edita nombre/rol/estado
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const admin = await requireSystemAdmin();
    const id = params.id;
    const body = await req.json();

    // Campos permitidos
    const data: any = {};
    if (typeof body.name === "string") data.name = body.name;
    if (body.role && ["system_admin", "org_admin", "user"].includes(body.role)) data.role = body.role;
    if (typeof body.isActive === "boolean") data.isActive = body.isActive;
    if (typeof body.isSuspended === "boolean") {
      data.isSuspended = body.isSuspended;
      data.suspendedAt = body.isSuspended ? new Date() : null;
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true, name: true, email: true, role: true,
        isActive: true, isSuspended: true, suspendedAt: true, updatedAt: true,
      },
    });

    // (Opcional) log de evento de estado
    if (typeof body.isSuspended === "boolean") {
      await prisma.userStatusEvent.create({
        data: {
          userId: id,
          type: body.isSuspended ? "SUSPENDED" : "REACTIVATED",
          reason: body.reason ?? null,
        },
      });
    }

    return NextResponse.json({ ok: true, user: updated });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return NextResponse.json({ ok: false, error: e?.message ?? "PATCH_USER_ERROR" }, { status: 500 });
  }
}

// DELETE /api/admin/users/:id  -> borra usuario y dependencias
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const admin = await requireSystemAdmin();
    const id = params.id;

    if (admin.id === id) {
      return NextResponse.json({ ok: false, error: "CANNOT_DELETE_SELF" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ ok: true }); // idempotente

    await prisma.$transaction(async (tx) => {
      // soltar referencias en Response
      await tx.response.updateMany({ where: { createdById: id }, data: { createdById: null } });
      await tx.response.updateMany({ where: { editedById: id }, data: { editedById: null } });

      await tx.account.deleteMany({ where: { userId: id } });
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
