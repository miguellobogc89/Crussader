"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import type { KnowledgeVisibility } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/** Session obligatoria */
async function requireSessionEmail() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");
  return session.user.email!;
}

/** Devuelve los companyId del usuario (permisos) */
export async function getUserCompanyIds(): Promise<string[]> {
  const email = await requireSessionEmail();
  const user = await prisma.user.findUnique({
    where: { email },
    select: { UserCompany: { select: { companyId: true } } },
  });
  return (user?.UserCompany ?? []).map((uc) => uc.companyId);
}

/** Valida que companyId ∈ empresas del usuario */
export async function assertCompanyOwnership(companyId: string) {
  const allowed = await getUserCompanyIds();
  if (!allowed.includes(companyId)) throw new Error("Forbidden");
}

/** Crear sección en una empresa concreta (validada) */
export async function createSection(formData: FormData) {
  const companyId = String(formData.get("companyId") || "");
  await assertCompanyOwnership(companyId);

  const title = ((formData.get("title") as string) || "Nueva sección").trim();
  const visibility = (formData.get("visibility") as KnowledgeVisibility) || "PUBLIC";

  const max = await prisma.knowledgeSection.aggregate({
    _max: { position: true },
    where: { companyId },
  });
  const position = (max._max.position ?? -1) + 1;

  await prisma.knowledgeSection.create({
    data: {
      companyId,
      title,
      slug: `${Date.now()}`,
      content: "",
      visibility,
      position,
      isActive: true,
    },
  });

  revalidatePath("/dashboard/knowledge");
}

/** Borrar sección (verifica que la sección pertenece a una empresa del usuario) */
export async function deleteSection(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;

  const sec = await prisma.knowledgeSection.findUnique({
    where: { id },
    select: { id: true, companyId: true },
  });
  if (!sec) return;

  await assertCompanyOwnership(sec.companyId);

  await prisma.knowledgeSection.delete({ where: { id } });

  // Compactar positions
  const siblings = await prisma.knowledgeSection.findMany({
    where: { companyId: sec.companyId },
    orderBy: { position: "asc" },
    select: { id: true },
  });
  await Promise.all(
    siblings.map((s, i) =>
      prisma.knowledgeSection.update({ where: { id: s.id }, data: { position: i } })
    )
  );

  revalidatePath("/dashboard/knowledge");
}

/** Guardar edición (valida pertenencia) */
export async function saveSection(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;

  const sec = await prisma.knowledgeSection.findUnique({
    where: { id },
    select: { id: true, companyId: true },
  });
  if (!sec) throw new Error("Not found");

  await assertCompanyOwnership(sec.companyId);

  const title = ((formData.get("title") as string) || "").trim();
  const visibility = (formData.get("visibility") as KnowledgeVisibility) || "PUBLIC";
  const content = ((formData.get("content") as string) || "").trim();

  await prisma.knowledgeSection.update({
    where: { id },
    data: { title, visibility, content },
  });

  revalidatePath("/dashboard/knowledge");
}
