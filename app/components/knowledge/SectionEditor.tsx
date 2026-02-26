import React, { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { saveSection, assertCompanyOwnership } from "./sections-actions";
import { Separator } from "@/app/components/ui/separator";
import Spinner from "@/app/components/crussader/UX/Spinner";
import { SectionTitleClient } from "./SectionTitleClient";
import { KnowledgeContentClient } from "./KnowledgeContentClient";

export const dynamic = "force-dynamic";

export default async function SectionEditor({
  selectedId,
  basePath,
  companyId,
}: {
  selectedId?: string;
  basePath: string;
  companyId: string;
}) {
  if (!companyId) {
    return (
      <div className="h-full min-h-0 flex items-center justify-center">
        <div className="text-sm text-muted-foreground">
          No hay empresa seleccionada.
        </div>
      </div>
    );
  }

  await assertCompanyOwnership(companyId);

  return (
    <div className="h-full min-h-0 overflow-hidden">
      <Suspense
        key={selectedId ?? "empty"}
        fallback={
          <div className="h-full min-h-0 flex items-center justify-center">
            <Spinner centered size={48} />
          </div>
        }
      >
        <SectionEditorContent
          selectedId={selectedId}
          basePath={basePath}
          companyId={companyId}
        />
      </Suspense>
    </div>
  );
}

async function SectionEditorContent({
  selectedId,
  basePath,
  companyId,
}: {
  selectedId?: string;
  basePath: string;
  companyId: string;
}) {
  if (!selectedId) {
    const any = await prisma.knowledgeSection.findFirst({
      where: { companyId, isActive: true },
      orderBy: [{ position: "asc" }, { updatedAt: "desc" }],
      select: { id: true },
    });

    return (
      <div className="h-full min-h-0 overflow-hidden">
        <div className="p-6">
          <h2 className="mt-1 text-lg font-semibold text-slate-900">
            {any ? "Selecciona una sección" : "Empieza creando una sección"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {any
              ? "Elige una sección en la izquierda para editarla."
              : "Usa el panel izquierdo para añadir tu primera sección."}
          </p>
        </div>
      </div>
    );
  }

  const section = await prisma.knowledgeSection.findUnique({
    where: { id: selectedId },
    select: {
      id: true,
      title: true,
      content: true,
      updatedAt: true,
      companyId: true,
    },
  });

  if (!section || section.companyId !== companyId) {
    return (
      <div className="h-full min-h-0 overflow-hidden">
        <div className="p-6">
          <div className="rounded-2xl border border-red-200/70 bg-red-50 p-5">
            <div className="text-sm font-semibold text-red-700">
              Acceso denegado
            </div>
            <div className="mt-1 text-sm text-red-700/80">
              Esta sección no existe o no pertenece a la empresa seleccionada.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 overflow-hidden flex flex-col">
      <div className="p-6 pb-4">

<SectionTitleClient
  title={section.title ?? ""}
  sectionId={section.id}
  action={saveSection}
/>

        <div className="mt-1 text-[11px] text-muted-foreground">
          Última edición: {new Date(section.updatedAt!).toLocaleString()}
        </div>

        <Separator className="my-5 bg-slate-200/70" />
      </div>

      {/* Form + footer sticky (client) */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <KnowledgeContentClient
          basePath={basePath}
          sectionId={section.id}
          initialContent={section.content ?? ""}
          action={saveSection}
        />
      </div>
    </div>
  );
}