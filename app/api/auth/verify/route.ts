import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      return NextResponse.json({ ok: false, error: "INVALID_PARAMS" }, { status: 400 });
    }

    const vt = await prisma.verificationToken.findUnique({ where: { token } });
    if (!vt || vt.identifier !== email) {
      return NextResponse.json({ ok: false, error: "TOKEN_NOT_FOUND" }, { status: 404 });
    }
    if (vt.expires < new Date()) {
      return NextResponse.json({ ok: false, error: "TOKEN_EXPIRED" }, { status: 410 });
    }

    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    await prisma.verificationToken.delete({ where: { token } });
    return NextResponse.redirect(
    `${process.env.AUTH_URL}/auth?verified=1&email=${encodeURIComponent(email)}&next=/dashboard`
    );
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message ?? "VERIFY_ERROR" }, { status: 500 });
  }
}
