import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

const ACTIVE_COOKIE = "active_company_id";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email ?? null;
    if (!email) return NextResponse.json({ ok:false, error:"unauth" }, { status:401 });

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) return NextResponse.json({ ok:false, error:"no_user" }, { status:400 });

    const { companyId } = await req.json().catch(() => ({} as any));

    // Si no llega companyId, usa la primera del usuario
    let targetId = companyId as string | undefined;
    if (!targetId) {
      const first = await prisma.userCompany.findFirst({
        where: { userId: user.id },
        select: { companyId: true },
        orderBy: { createdAt: "asc" },
      });
      if (!first) return NextResponse.json({ ok:false, error:"no_companies" }, { status:404 });
      targetId = first.companyId;
    }

    // Valida pertenencia
    const belongs = await prisma.userCompany.findFirst({
      where: { userId: user.id, companyId: targetId },
      select: { companyId: true },
    });
    if (!belongs) return NextResponse.json({ ok:false, error:"forbidden_company" }, { status:403 });

    // Aquí sí puedes setear cookie (Route Handler => RequestCookies mutables)
    const jar = await cookies();
    jar.set(ACTIVE_COOKIE, targetId, {
      path: "/",
      sameSite: "lax",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 180,
    });

    return NextResponse.json({ ok:true, activeCompanyId: targetId }, { status:200 });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e?.message ?? "set_active_company_failed" }, { status:500 });
  }
}
