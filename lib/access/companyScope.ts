// lib/access/companyScope.ts
import { PrismaClient } from "@prisma/client";

/** Admin global según vuestra sesión */
export function isSystemAdmin(user: any): boolean {
  return (user?.role ?? "").toLowerCase() === "system_admin";
}

/** WHERE por visibilidad: Admin ⇒ sin filtro; resto ⇒ donde tenga UserCompany */
export function companyWhereForUser(user: any) {
  if (isSystemAdmin(user)) return {};
  const userId: string | undefined = user?.id;
  if (!userId) return { id: "__none__" }; // fuerza vacío si no hay user
  return { UserCompany: { some: { userId } } };
}

/** Mezcla args con el WHERE de alcance (útil para findMany/findFirst) */
export function companyFilterArgs<T extends object>(user: any, baseArgs?: T): T {
  const base = (baseArgs ?? {}) as any;
  const scopeWhere = companyWhereForUser(user);
  const mergedWhere = base.where ? { AND: [base.where, scopeWhere] } : scopeWhere;
  return { ...(base as object), where: mergedWhere } as T;
}

/** Asegura acceso a una company concreta; lanza si no hay permisos */
export async function assertCompanyAccess(
  prisma: PrismaClient,
  user: any,
  companyId: string
) {
  if (!companyId) throw new Error("companyId_required");
  if (isSystemAdmin(user)) return true;

  const userId: string | undefined = user?.id;
  if (!userId) throw new Error("unauthorized");

  // chequeo directo en la tabla de unión UserCompany
  const link = await prisma.userCompany.findFirst({
    where: { userId, companyId },
    select: { id: true },
  });
  if (!link) throw new Error("forbidden");
  return true;
}
