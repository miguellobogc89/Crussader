// app/api/account/ownership/transfer/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  targetUserId: z.string().min(1),
});

async function getSessionUser() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  return { session, userId };
}

/**
 * POST /api/account/ownership/transfer
 * Body: { targetUserId }
 * Solo el owner actual de la account puede usarlo.
 */
export async function POST(req: Request) {
  try {
    const { session, userId } = await getSessionUser();

    if (!session || !userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const raw = await req.text();
    let body: unknown = null;
    try {
      body = raw ? JSON.parse(raw) : {};
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Validation error", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { targetUserId } = parsed.data;

    // 1) Encontrar la account donde el user actual es owner
    const account = await prisma.account.findFirst({
      where: { owner_user_id: userId },
      select: { id: true, owner_user_id: true },
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

    if (targetUserId === userId) {
      return NextResponse.json(
        {
          ok: false,
          error: "SAME_USER",
          message: "El nuevo propietario no puede ser el mismo usuario.",
        },
        { status: 400 }
      );
    }

    // 2) Verificar que el targetUser pertenece a la misma account
    const targetUser = await prisma.user.findFirst({
      where: {
        id: targetUserId,
        account_id: account.id,
      },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        {
          ok: false,
          error: "TARGET_NOT_IN_ACCOUNT",
          message: "El usuario destino no pertenece a esta cuenta.",
        },
        { status: 400 }
      );
    }

    // 3) Transferir ownership
    await prisma.account.update({
      where: { id: account.id },
      data: {
        owner_user_id: targetUser.id,
      },
    });

    return NextResponse.json({
      ok: true,
      accountId: account.id,
      oldOwnerId: userId,
      newOwnerId: targetUser.id,
    });
  } catch (e: any) {
    console.error("Error transferring ownership", e);
    return NextResponse.json(
      { ok: false, error: "Internal error", debug: e?.message || String(e) },
      { status: 500 }
    );
  }
}
