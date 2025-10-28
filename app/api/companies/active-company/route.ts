// app/api/active-company/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTIVE_COOKIE = "active_company_id";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email ?? null;
    if (!email) {
      return NextResponse.json({ ok: false, error: "unauth" }, { status: 401 });
    }

    const { companyId } = (await req.json()) as { companyId?: string };
    if (!companyId || typeof companyId !== "string") {
      return NextResponse.json({ ok: false, error: "invalid_company_id" }, { status: 400 });
    }

    // Valida que la empresa pertenezca al usuario
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ ok: false, error: "no_user" }, { status: 400 });
    }

    const belongs = await prisma.userCompany.findFirst({
      where: { userId: user.id, companyId },
      select: { companyId: true },
    });
    if (!belongs) {
      return NextResponse.json({ ok: false, error: "forbidden_company" }, { status: 403 });
    }

    // Setea cookie activa (lax, accesible en cliente)
    const jar = await cookies();
    jar.set(ACTIVE_COOKIE, companyId, {
      path: "/",
      sameSite: "lax",
      httpOnly: false, // debe ser false si la lees desde el cliente
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365, // 1 año
    });

    return NextResponse.json({ ok: true, activeCompanyId: companyId });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "unexpected_error" },
      { status: 500 }
    );
  }
}
