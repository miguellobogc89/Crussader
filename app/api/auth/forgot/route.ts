// app/api/auth/forgot/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
// si tienes util de email, crea sendPasswordResetEmail similar a sendVerificationEmail
import { sendPasswordResetEmail } from "@/lib/email"; 

export async function POST(req: Request) {
  try {
    const { email: raw } = await req.json();
    const email = (raw || "").trim().toLowerCase();
    if (!email) return NextResponse.json({ ok: false, error: "EMAIL_REQUIRED" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });

    // Siempre respondemos 200 para no “filtrar” existencia
    // Pero si existe, generamos token y enviamos correo
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hora

      // Namespacing en identifier para no mezclar con verificación de email
      // identifier = "reset:<email>"
      await prisma.verificationToken.create({
        data: { identifier: `reset:${email}`, token, expires },
      });

      const base =
        process.env.AUTH_URL ||
        process.env.NEXT_PUBLIC_BASE_URL ||
        "http://localhost:3000";

      const resetUrl = `${base}/auth/reset?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

      // Enviar email real
      try {
        await sendPasswordResetEmail(email, resetUrl);
      } catch (e) {
        // Si falla el email, opcionalmente elimina el token creado
        await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
        // Para no revelar info, devolvemos ok igualmente
      }

      const payload: any = { ok: true };
      if (process.env.NODE_ENV !== "production") payload.resetUrl = resetUrl;
      return NextResponse.json(payload);
    }

    // Usuario no existe -> respuesta OK idéntica
    const payload: any = { ok: true };
    return NextResponse.json(payload);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "FORGOT_ERROR" }, { status: 500 });
  }
}
