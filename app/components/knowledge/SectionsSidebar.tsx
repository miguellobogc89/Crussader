import React from "react";
import { prisma } from "@/lib/prisma";
import { createSection, deleteSection, assertCompanyOwnership } from "./sections-actions";
import type { KnowledgeVisibility } from "@prisma/client";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Separator } from "@/app/components/ui/separator";
import SubmitButton from "@/app/components/ui/SubmitButton";
import { Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

function VisibilityPill({ v }: { v: KnowledgeVisibility }) {
  const variant = v === "PUBLIC" ? "default" : "secondary";
  return <Badge variant={variant}>{v}</Badge>;
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
  // Seguridad: el usuario debe tener esa company
  await assertCompanyOwnership(companyId);

  const sections = await prisma.knowledgeSection.findMany({
    where: { companyId, isActive: true },
    orderBy: [{ position: "asc" }, { updatedAt: "desc" }],
    select: { id: true, title: true, visibility: true, updatedAt: true },
  });

  return (
    <aside className="w-[320px] border-r bg-gradient-to-b from-white to-muted/30">
      <div className="p-4">
        <h2 className="text-sm font-semibold text-muted-foreground">Knowledge</h2>
        <h1 className="mt-1 text-xl font-bold tracking-tight">Secciones</h1>

        <form action={createSection} className="mt-4 flex gap-2">
          <input type="hidden" name="visibility" value="PUBLIC" />
          <input type="hidden" name="companyId" value={companyId} />
          <Input name="title" placeholder="Nueva sección…" className="flex-1" />
          <SubmitButton variant="secondary">Añadir</SubmitButton>
        </form>
      </div>

      <Separator />

      <ScrollArea className="h-[calc(100vh-160px)]">
        <nav className="p-3 space-y-3">
          {sections.map((s) => (
            <div
              key={s.id}
              className={[
                "rounded-xl border",
                selectedId === s.id ? "bg-muted/60 border-border" : "bg-background border-transparent",
                "transition-colors",
              ].join(" ")}
            >
              <a
                href={`${basePath}?companyId=${companyId}&sectionId=${s.id}`}
                className="block p-3 hover:bg-muted/40 rounded-xl"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-sm line-clamp-1">
                    {s.title || "(sin título)"}
                  </div>
                  <VisibilityPill v={s.visibility as KnowledgeVisibility} />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {new Date(s.updatedAt).toLocaleString()}
                </div>
              </a>

              <form action={deleteSection} className="px-3 pb-3">
                <input type="hidden" name="id" value={s.id} />
                <SubmitButton variant="ghost" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                  Borrar
                </SubmitButton>
              </form>
            </div>
          ))}

          {!sections.length && (
            <div className="text-sm text-muted-foreground px-3 py-6 rounded-xl border bg-background">
              No hay secciones en esta empresa. Crea la primera con el formulario de arriba.
            </div>
          )}
        </nav>
      </ScrollArea>

      <Separator />
      <div className="p-4 text-xs text-muted-foreground">
        Total: <span className="font-semibold">{sections.length}</span> secciones
      </div>
    </aside>
  );
}
