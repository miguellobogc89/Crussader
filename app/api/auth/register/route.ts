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
  name?: string; // retrocompat
  email: string;
  password: string;
  acceptTerms: boolean;
  marketingOptIn?: boolean;
  next?: string;
  inviteCode?: string;
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
    const inviteCodeRaw = (raw.inviteCode || "").toString().trim();

    let firstName = (raw.firstName || "").trim();
    let lastName = (raw.lastName || "").trim();

    // retrocompat: si llega `name`
    if ((!firstName || !lastName) && raw.name) {
      const parts = String(raw.name).trim().split(/\s+/);
      if (!firstName && parts[0]) firstName = parts[0];
      if (!lastName && parts.slice(1).length) {
        lastName = parts.slice(1).join(" ");
      }
    }

    // --- validaciones básicas ---
    if (!firstName) {
      return NextResponse.json(
        { ok: false, error: "FIRST_NAME_REQUIRED" },
        { status: 400 },
      );
    }
    if (!lastName) {
      return NextResponse.json(
        { ok: false, error: "LAST_NAME_REQUIRED" },
        { status: 400 },
      );
    }
    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "EMAIL_AND_PASSWORD_REQUIRED" },
        { status: 400 },
      );
    }
    if (!acceptTerms) {
      return NextResponse.json(
        { ok: false, error: "TERMS_NOT_ACCEPTED" },
        { status: 400 },
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { ok: false, error: "WEAK_PASSWORD" },
        { status: 400 },
      );
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json(
        { ok: false, error: "EMAIL_ALREADY_EXISTS" },
        { status: 409 },
      );
    }

    const hasInvite = !!inviteCodeRaw;
    let invite:
      | (typeof prisma.invite extends { findUnique(args: any): any }
          ? Awaited<ReturnType<(typeof prisma.invite)["findUnique"]>>
          : any)
      | null = null;

    if (hasInvite) {
      const inviteCode = inviteCodeRaw.toUpperCase();

      invite = await prisma.invite.findUnique({
        where: { code: inviteCode },
      });

      if (!invite) {
        return NextResponse.json(
          { ok: false, error: "INVALID_INVITE_CODE" },
          { status: 400 },
        );
      }

      const now = new Date();

      if (invite.expires_at && invite.expires_at <= now) {
        return NextResponse.json(
          { ok: false, error: "INVITE_EXPIRED" },
          { status: 400 },
        );
      }

      if (
        invite.max_uses !== null &&
        invite.max_uses !== undefined &&
        invite.used_count >= invite.max_uses
      ) {
        return NextResponse.json(
          { ok: false, error: "INVITE_MAX_USES_REACHED" },
          { status: 400 },
        );
      }

      if (invite.email && invite.email.toLowerCase() !== email) {
        return NextResponse.json(
          { ok: false, error: "INVITE_EMAIL_MISMATCH" },
          { status: 400 },
        );
      }
    }

    const fullName = `${firstName} ${lastName}`.trim();

    // --- rama con invite (beta cerrada) ---
    if (hasInvite && invite) {
      const result = await prisma.$transaction(async (tx) => {
        const passwordHash = await hashPassword(password);

        const user = await tx.user.create({
          data: {
            name: fullName,
            first_name: firstName,
            last_name: lastName,
            email,
            passwordHash,
            role: "user",
            isActive: true,
            isSuspended: false,
            termsAcceptedAt: new Date(),
            privacyAcceptedAt: new Date(),
            marketingOptIn,
            emailVerified: new Date(), // ✅ Verificado directamente por invite
          },
        });

        await tx.invite.update({
          where: { id: invite.id },
          data: {
            used_count: { increment: 1 },
            status: "USED" as any,
          },
        });

        return { user };
      });

      return NextResponse.json({
        ok: true,
        mode: "invite",
        message: "Cuenta creada correctamente mediante invitación.",
        userId: result.user.id,
      });
    }

    // --- rama sin invite (registro abierto clásico) ---
    const passwordHash = await hashPassword(password);

    await prisma.user.create({
      data: {
        name: fullName,
        first_name: firstName,
        last_name: lastName,
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

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h

    await prisma.verificationToken.create({
      data: { identifier: email, token, expires },
    });

    const base =
      process.env.AUTH_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      "http://localhost:3000";

    const verifyUrl = `${base}/api/auth/verify?token=${encodeURIComponent(
      token,
    )}&email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`;

    await sendVerificationEmail(email, verifyUrl);

    const payload: any = { ok: true, mode: "email_verify" };
    if (process.env.NODE_ENV !== "production") {
      payload.verifyUrl = verifyUrl;
    }

    return NextResponse.json(payload);
  } catch (e: any) {
    console.error("[register] ERROR:", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "REGISTER_ERROR" },
      { status: 500 },
    );
  }
}
