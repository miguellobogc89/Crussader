// app/api/account/deactivate/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/account/deactivate
 * Solo el owner de la account puede desactivarla.
 * No borra nada: solo marca status = "inactive" y opcionalmente toca subscription_status.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;

    if (!session || !userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Buscar la account donde este user es owner
    const account = await prisma.account.findFirst({
      where: { owner_user_id: userId },
      select: {
        id: true,
        status: true,
        subscription_status: true,
      },
    });

    if (!account) {
      return NextResponse.json(
        {
          ok: false,
          error: "NOT_OWNER",
          message: "No eres propietario de ninguna cuenta.",
        },
        { status: 403 }
      );
    }

    if (account.status === "inactive") {
      return NextResponse.json({
        ok: true,
        accountId: account.id,
        status: account.status,
        subscription_status: account.subscription_status,
        alreadyInactive: true,
      });
    }

    const updated = await prisma.account.update({
      where: { id: account.id },
      data: {
        status: "inactive",
        subscription_status: "CANCELED", // si no quieres tocarlo, quita esta línea
      },
      select: {
        id: true,
        status: true,
        subscription_status: true,
      },
    });

    return NextResponse.json({
      ok: true,
      accountId: updated.id,
      status: updated.status,
      subscription_status: updated.subscription_status,
    });
  } catch (e: any) {
    console.error("Error deactivating account", e);
    return NextResponse.json(
      { ok: false, error: "Internal error", debug: e?.message || String(e) },
      { status: 500 }
    );
  }
}
