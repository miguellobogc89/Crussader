// lib/authz.ts
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

// Re-exportamos authOptions desde la ruta de NextAuth
import { authOptions as nextAuthOptions } from "@/app/api/auth/[...nextauth]/route";
export const authOptions = nextAuthOptions;

export async function getUserAuth() {
  const session = await getServerSession(authOptions);

  const email = session?.user?.email ?? null;
  const role = (session?.user as any)?.role ?? "user";
  if (!email) throw Object.assign(new Error("unauth"), { status: 401 });

  const me = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!me) throw Object.assign(new Error("no_user"), { status: 400 });

  return { userId: me.id, isAdmin: role === "system_admin" };
}

/** Lanza 403 si el user no pertenece a la empresa */
export async function assertCompanyMember(
  companyId: string,
  userId: string,
  isAdmin = false
) {
  if (isAdmin) return;
  const rel = await prisma.userCompany.findFirst({
    where: { companyId, userId },
    select: { id: true },
  });
  if (!rel) throw Object.assign(new Error("forbidden_company"), { status: 403 });
}
