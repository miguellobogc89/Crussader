// app/actions/setActiveCompanyCookie.ts
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { can } from "@/lib/permissions"; // ← NUEVO

const ACTIVE_COOKIE = "active_company_id";

export async function setActiveCompanyCookieAction(companyId: string) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) throw Object.assign(new Error("unauth"), { status: 401 });

  // ⬇️ Lee también el role
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });
  if (!user) throw Object.assign(new Error("no_user"), { status: 400 });

  // ⬇️ AQUÍ VA EL PERMISO
  if (!can(user, "company.switch")) {
    throw Object.assign(new Error("forbidden"), { status: 403 });
  }

  // ⬇️ Solo exige pertenencia si NO es system_admin
  if (user.role !== "system_admin") {
    const belongs = await prisma.userCompany.findFirst({
      where: { userId: user.id, companyId },
      select: { companyId: true },
    });
    if (!belongs) throw Object.assign(new Error("forbidden_company"), { status: 403 });
  }

  const jar = await cookies();
  jar.set(ACTIVE_COOKIE, companyId, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365,
  });

  return true;
}
