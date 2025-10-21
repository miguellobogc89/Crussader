// app/api/auth/verify/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const email = url.searchParams.get("email");
    // opcional: next arrastra el destino final tras loguear
    const next = url.searchParams.get("next") || "/dashboard";

    if (!token || !email) {
      return NextResponse.redirect(
        new URL(`/auth/login?verified=0&email=${encodeURIComponent(email || "")}`, url.origin)
      );
    }

    const vt = await prisma.verificationToken.findUnique({ where: { token } });
    if (!vt || vt.identifier !== email) {
      return NextResponse.redirect(
        new URL(`/auth/login?verified=0&email=${encodeURIComponent(email)}`, url.origin)
      );
    }
    if (vt.expires < new Date()) {
      // token expirado
      await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
      return NextResponse.redirect(
        new URL(`/auth/login?verified=0&email=${encodeURIComponent(email)}`, url.origin)
      );
    }

    // Marca el email como verificado
    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    // Consume el token
    await prisma.verificationToken.delete({ where: { token } });

    // Redirige a la PÁGINA DE LOGIN (nueva), mostrando banner y pre-rellenando email.
    const target = new URL(
      `/auth/login?verified=1&email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`,
      url.origin
    );
    return NextResponse.redirect(target);
  } catch (e: any) {
    // En error, redirige a login sin banner
    const url = new URL(req.url);
    return NextResponse.redirect(new URL("/auth/login", url.origin));
  }
}
