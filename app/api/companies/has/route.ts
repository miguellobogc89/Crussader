// app/api/companies/has/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ ok: true, hasCompany: false });
  }

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!me) return NextResponse.json({ ok: true, hasCompany: false });

  const count = await prisma.userCompany.count({ where: { userId: me.id } });
  return NextResponse.json({ ok: true, hasCompany: count > 0 });
}
