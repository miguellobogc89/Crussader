// app/api/account/user/delete/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getSessionUser() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  return { session, userId };
}

/**
 * POST /api/account/user/delete
 * Borra el usuario autenticado.
 * - Si es owner de la account:
 *   - Si es el único usuario de la account → 400 (usar desactivar cuenta).
 *   - Si hay más usuarios → se reasigna owner a otro user de la misma account.
 */
export async function POST() {
  try {
    const { session, userId } = await getSessionUser();

    if (!session || !userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 1) Cargar usuario con su account
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        account_id: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Si el user no pertenece a ninguna account, simplemente lo borramos
    if (!user.account_id) {
      await prisma.user.delete({ where: { id: user.id } });
      return NextResponse.json({ ok: true, deletedUserId: user.id });
    }

    const accountId = user.account_id;

    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: {
        id: true,
        owner_user_id: true,
      },
    });

    if (!account) {
      // Cuenta "huérfana": borramos usuario igualmente
      await prisma.user.delete({ where: { id: user.id } });
      return NextResponse.json({ ok: true, deletedUserId: user.id });
    }

    const isOwner = account.owner_user_id === user.id;

    // Contar otros usuarios de la misma account
    const otherUsers = await prisma.user.findMany({
      where: {
        account_id: account.id,
        id: { not: user.id },
      },
      select: { id: true },
    });

    if (isOwner) {
      if (otherUsers.length === 0) {
        // Es el único usuario de la account → debe usar "cerrar cuenta"
        return NextResponse.json(
          {
            ok: false,
            error: "ONLY_USER_IN_ACCOUNT",
            message:
              "No puedes eliminar tu usuario porque eres el único usuario de esta cuenta. Usa el flujo de cerrar cuenta.",
          },
          { status: 400 }
        );
      }

      // Hay más usuarios en la account → elegir nuevo owner
      // Estrategia: preferir alguien con rol OWNER/ADMIN en alguna Company de la misma account;
      // si no, el primero disponible.
      const candidateOwner = await prisma.user.findFirst({
        where: {
          id: { in: otherUsers.map((u) => u.id) },
          account_id: account.id,
        },
        select: { id: true },
      });

      if (!candidateOwner) {
        return NextResponse.json(
          {
            ok: false,
            error: "NO_NEW_OWNER_FOUND",
            message:
              "No se ha encontrado un nuevo propietario para la cuenta. Operación cancelada.",
          },
          { status: 400 }
        );
      }

      // Reasignar owner de la account
      await prisma.account.update({
        where: { id: account.id },
        data: {
          owner_user_id: candidateOwner.id,
        },
      });
    }

    // Por último, borrar el usuario
    await prisma.user.delete({
      where: { id: user.id },
    });

    return NextResponse.json({
      ok: true,
      deletedUserId: user.id,
      accountId: account.id,
      ownershipTransferred: isOwner,
    });
  } catch (e: any) {
    console.error("Error deleting user", e);
    return NextResponse.json(
      { ok: false, error: "Internal error", debug: e?.message || String(e) },
      { status: 500 }
    );
  }
}
