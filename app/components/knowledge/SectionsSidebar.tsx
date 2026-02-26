// app/components/knowledge/SectionsSidebar.tsx
import React from "react";
import { prisma } from "@/lib/prisma";
import {
  createSection,
  deleteSection,
  assertCompanyOwnership,
} from "./sections-actions";
import type { KnowledgeVisibility } from "@prisma/client";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Separator } from "@/app/components/ui/separator";
import SubmitButton from "@/app/components/ui/SubmitButton";
import { Plus, Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

function VisibilityPill({ v }: { v: KnowledgeVisibility }) {
  const isPublic = v === "PUBLIC";
  return (
    <Badge
      variant={isPublic ? "default" : "secondary"}
      className="text-[11px] px-2 py-0.5"
    >
      {isPublic ? "Public" : "Private"}
    </Badge>
  );
}

export default async function SectionsSidebar({
  basePath,
  selectedId,
  companyId,
}: {
  basePath: string;
  selectedId?: string;
  companyId: string;
}) {
  await assertCompanyOwnership(companyId);

  const sections = await prisma.knowledgeSection.findMany({
    where: { companyId, isActive: true },
    orderBy: [{ position: "asc" }, { updatedAt: "desc" }],
    select: { id: true, title: true, visibility: true, updatedAt: true },
  });

  return (
    // min-h-0 + flex-col para que el ScrollArea coja el alto correcto
    <aside className="w-[280px] shrink-0 border-r bg-background flex flex-col min-h-0">
      {/* Header fijo */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-muted-foreground tracking-wide">
              KNOWLEDGE
            </div>
            <h2 className="mt-1 text-base font-semibold">Secciones</h2>
          </div>
          <div className="text-xs text-muted-foreground">{sections.length}</div>
        </div>

        <form action={createSection} className="mt-4 space-y-2">
          <input type="hidden" name="visibility" value="PUBLIC" />
          <input type="hidden" name="companyId" value={companyId} />

          <div className="flex gap-2">
            <Input
              name="title"
              placeholder="Nueva sección…"
              className="h-9"
              autoComplete="off"
            />
            <SubmitButton variant="secondary" className="h-9 px-3">
              <Plus className="h-4 w-4" />
            </SubmitButton>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Mantén aquí FAQs, servicios, precios, políticas…
          </p>
        </form>
      </div>

      <Separator />

      {/* Scroll SOLO aquí */}
      <ScrollArea className="flex-1 min-h-0">
        <nav className="p-3 space-y-2">
          {sections.map((s) => {
            const isActive = selectedId === s.id;

            return (
              <div
                key={s.id}
                className={[
                  "rounded-xl border transition-colors",
                  isActive
                    ? "bg-muted/40 border-border"
                    : "bg-background border-transparent hover:bg-muted/30",
                ].join(" ")}
              >
                <a
                  href={`${basePath}?companyId=${companyId}&sectionId=${s.id}`}
                  className="block p-3 rounded-xl"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium line-clamp-1">
                        {s.title || "(sin título)"}
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {new Date(s.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <VisibilityPill v={s.visibility as KnowledgeVisibility} />
                  </div>
                </a>

                <div className="px-3 pb-3">
                  <form action={deleteSection}>
                    <input type="hidden" name="id" value={s.id} />
                    <SubmitButton
                      variant="ghost"
                      className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Borrar
                    </SubmitButton>
                  </form>
                </div>
              </div>
            );
          })}

          {!sections.length && (
            <div className="text-sm text-muted-foreground px-3 py-6 rounded-xl border bg-background">
              No hay secciones en esta empresa.
            </div>
          )}
        </nav>
      </ScrollArea>

      <Separator />

      {/* Footer fijo */}
      <div className="p-4 text-[11px] text-muted-foreground">
        PUBLIC = respuestas externas · PRIVATE = interno autenticado
      </div>
    </aside>
  );
}