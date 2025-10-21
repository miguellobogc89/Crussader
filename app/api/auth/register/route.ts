// app/api/auth/register/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/hash";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/email";

type RegisterBody = {
  firstName?: string;
  lastName?: string;
  // retrocompat: si te llega `name`, lo dividimos (best-effort)
  name?: string;
  email: string;
  password: string;
  acceptTerms: boolean;
  marketingOptIn?: boolean;
  next?: string;
};

export async function POST(req: Request) {
  try {
    const raw = (await req.json()) as RegisterBody;

    // --- normalizar entradas ---
    const email = (raw.email || "").trim().toLowerCase();
    const password = raw.password || "";
    const acceptTerms = !!raw.acceptTerms;
    const marketingOptIn = !!raw.marketingOptIn;
    const next = raw.next || "/dashboard";

    // Nombre y apellidos obligatorios
    let firstName = (raw.firstName || "").trim();
    let lastName = (raw.lastName || "").trim();

    // retrocompat: si llega `name` pero no vienen separados
    if ((!firstName || !lastName) && raw.name) {
      const parts = String(raw.name).trim().split(/\s+/);
      if (!firstName && parts[0]) firstName = parts[0];
      if (!lastName && parts.slice(1).length) lastName = parts.slice(1).join(" ");
    }

    // --- validaciones ---
    if (!firstName) {
      return NextResponse.json({ ok: false, error: "FIRST_NAME_REQUIRED" }, { status: 400 });
    }
    if (!lastName) {
      return NextResponse.json({ ok: false, error: "LAST_NAME_REQUIRED" }, { status: 400 });
    }
    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "EMAIL_AND_PASSWORD_REQUIRED" }, { status: 400 });
    }
    if (!acceptTerms) {
      return NextResponse.json({ ok: false, error: "TERMS_NOT_ACCEPTED" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ ok: false, error: "WEAK_PASSWORD" }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ ok: false, error: "EMAIL_ALREADY_EXISTS" }, { status: 409 });
    }

    // --- crear usuario sin iniciar sesión ---
    const passwordHash = await hashPassword(password);
    const fullName = `${firstName} ${lastName}`.trim();

    await prisma.user.create({
      data: {
        name: fullName,
        email,
        passwordHash,
        role: "user",
        isActive: true,
        isSuspended: false,
        termsAcceptedAt: new Date(),
        privacyAcceptedAt: new Date(),
        marketingOptIn,
        // emailVerified: null -> hasta que confirme
      },
    });

    // --- token de verificación (24h) ---
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);
    await prisma.verificationToken.create({
      data: { identifier: email, token, expires },
    });

    // URL pública para construir el enlace
    const base =
      process.env.AUTH_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      "http://localhost:3000";

    // pasamos ?next para redirigir al login y luego al destino deseado
    const verifyUrl = `${base}/api/auth/verify?token=${encodeURIComponent(
      token
    )}&email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`;

    // enviar email real (si falla -> 500 para no mostrar éxito falso)
    await sendVerificationEmail(email, verifyUrl);

    const payload: any = { ok: true };
    if (process.env.NODE_ENV !== "production") payload.verifyUrl = verifyUrl;

    return NextResponse.json(payload);
  } catch (e: any) {
    console.error("[register] ERROR:", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "REGISTER_ERROR" },
      { status: 500 }
    );
  }
}
