// app/dashboard/knowledge/SectionsSidebar.tsx
import React from "react";
import { prisma } from "@/lib/prisma";
import { assertCompanyOwnership } from "./sections-actions";
import type { KnowledgeVisibility } from "@prisma/client";
import SectionsSidebarClient from "./SectionsSidebarClient";

export const dynamic = "force-dynamic";

type SectionRowClient = {
  id: string;
  title: string | null;
  visibility: KnowledgeVisibility;
  updatedAtMs: number;
};

export default async function SectionsSidebar({
  basePath,
  selectedId,
  companyId,
}: {
  basePath: string;
  selectedId?: string;
  companyId: string;
}) {
  if (!companyId) {
    return (
      <aside className="h-full min-h-0 flex flex-col p-4">
        <div className="text-sm text-muted-foreground">
          No hay empresa seleccionada.
        </div>
      </aside>
    );
  }

  await assertCompanyOwnership(companyId);

  const sections = await prisma.knowledgeSection.findMany({
    where: { companyId, isActive: true },
    orderBy: [{ position: "asc" }, { updatedAt: "desc" }],
    select: { id: true, title: true, visibility: true, updatedAt: true },
  });

  const sectionsClient: SectionRowClient[] = sections.map((s) => ({
    id: s.id,
    title: s.title,
    visibility: s.visibility as KnowledgeVisibility,
    updatedAtMs: s.updatedAt.getTime(),
  }));

  return (
    <SectionsSidebarClient
      basePath={basePath}
      selectedId={selectedId}
      companyId={companyId}
      sections={sectionsClient}
    />
  );
}