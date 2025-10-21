// app/api/auth/reset/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/hash";

export async function POST(req: Request) {
  try {
    const { token, email: rawEmail, password } = await req.json();
    const email = (rawEmail || "").trim().toLowerCase();

    if (!token || !email || !password) {
      return NextResponse.json({ ok: false, error: "INVALID_PARAMS" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ ok: false, error: "WEAK_PASSWORD" }, { status: 400 });
    }

    const vt = await prisma.verificationToken.findUnique({ where: { token } });
    if (!vt || vt.identifier !== `reset:${email}`) {
      return NextResponse.json({ ok: false, error: "TOKEN_NOT_FOUND" }, { status: 404 });
    }
    if (vt.expires < new Date()) {
      await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
      return NextResponse.json({ ok: false, error: "TOKEN_EXPIRED" }, { status: 410 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // El token es válido pero el usuario ya no existe -> consume token y responde ok genérico
      await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
      return NextResponse.json({ ok: true });
    }

    // Actualiza contraseña y limpia sesiones
    const passwordHash = await hashPassword(password);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          failedLoginCount: 0,
          // Opcional: si quieres forzar verificación tras reset, no toques emailVerified
        },
      });

      // Borra el token usado
      await tx.verificationToken.delete({ where: { token } });

      // Opcional: invalidar sesiones activas
      await tx.session.deleteMany({ where: { userId: user.id } });
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "RESET_ERROR" }, { status: 500 });
  }
}
