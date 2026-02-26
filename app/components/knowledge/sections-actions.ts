// app/dashboard/knowledge/sections-actions.tsx
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import type { KnowledgeVisibility } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireSessionEmail() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");
  return session.user.email!;
}

export async function getUserCompanyIds(): Promise<string[]> {
  const email = await requireSessionEmail();
  const user = await prisma.user.findUnique({
    where: { email },
    select: { UserCompany: { select: { companyId: true } } },
  });
  return (user?.UserCompany ?? []).map((uc) => uc.companyId);
}

export async function assertCompanyOwnership(companyId: string) {
  const email = await requireSessionEmail();

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      UserCompany: {
        select: { companyId: true },
      },
    },
  });

  const list = user?.UserCompany ?? [];
  for (const uc of list) {
    if (uc.companyId === companyId) return;
  }

  throw new Error("Forbidden");
}

export async function createSection(formData: FormData): Promise<string> {
  const companyId = String(formData.get("companyId") || "");
  if (!companyId) throw new Error("companyId required");

  await assertCompanyOwnership(companyId);

  const title = String(formData.get("title") || "").trim();
  if (!title) throw new Error("title required");

  const visibility =
    (formData.get("visibility") as KnowledgeVisibility) || "PUBLIC";

  // Queremos que la nueva sección salga arriba:
  // usamos la posición mínima actual y restamos 1.
  const min = await prisma.knowledgeSection.aggregate({
    _min: { position: true },
    where: { companyId, isActive: true },
  });

  const position = (min._min.position ?? 0) - 1;

  const created = await prisma.knowledgeSection.create({
    data: {
      companyId,
      title,
      slug: `${Date.now()}`,
      content: "",
      visibility,
      position,
      isActive: true,
    },
    select: { id: true },
  });

  revalidatePath("/dashboard/knowledge");
  return created.id;
}

export async function deleteSection(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;

  const sec = await prisma.knowledgeSection.findUnique({
    where: { id },
    select: { companyId: true },
  });

  if (!sec) return;

  await assertCompanyOwnership(sec.companyId);
  await prisma.knowledgeSection.delete({ where: { id } });

  revalidatePath("/dashboard/knowledge");
}

export async function saveSection(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;

  const sec = await prisma.knowledgeSection.findUnique({
    where: { id },
    select: { companyId: true },
  });

  if (!sec) throw new Error("Not found");

  await assertCompanyOwnership(sec.companyId);

  const title = String(formData.get("title") || "").trim();
  const visibility =
    (formData.get("visibility") as KnowledgeVisibility) || "PUBLIC";
  const content = String(formData.get("content") || "").trim();

  await prisma.knowledgeSection.update({
    where: { id },
    data: { title, visibility, content },
  });

  revalidatePath("/dashboard/knowledge");
}