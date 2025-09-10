// app/api/auth/register/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/hash";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { name, email, password, acceptTerms } = await req.json();

    if (!email || !password)
      return NextResponse.json({ ok: false, error: "EMAIL_AND_PASSWORD_REQUIRED" }, { status: 400 });
    if (!acceptTerms)
      return NextResponse.json({ ok: false, error: "TERMS_NOT_ACCEPTED" }, { status: 400 });

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists)
      return NextResponse.json({ ok: false, error: "EMAIL_ALREADY_EXISTS" }, { status: 409 });

    const passwordHash = await hashPassword(password);
    await prisma.user.create({
      data: {
        name: name ?? null,
        email,
        passwordHash,
        termsAcceptedAt: new Date(),
        privacyAcceptedAt: new Date(),
      },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h
    await prisma.verificationToken.create({ data: { identifier: email, token, expires } });

    const verifyUrl = `${process.env.AUTH_URL}/api/auth/verify?token=${token}&email=${encodeURIComponent(email)}`;
    console.log("[register] verifyUrl:", verifyUrl);

    // ⛔️ Si Resend falla, devolvemos 500 (no “pantalla de enviado” falsa)
    await sendVerificationEmail(email, verifyUrl);

    const payload: any = { ok: true };
    if (process.env.NODE_ENV !== "production") payload.verifyUrl = verifyUrl;
    return NextResponse.json(payload);
  } catch (e: any) {
    console.error("[register] ERROR:", e);
    return NextResponse.json({ ok: false, error: e?.message ?? "REGISTER_ERROR" }, { status: 500 });
  }
}
