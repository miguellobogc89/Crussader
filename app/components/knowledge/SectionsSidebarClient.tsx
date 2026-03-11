// app/dashboard/knowledge/SectionSideBarClient.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { KnowledgeVisibility } from "@prisma/client";
import { Input } from "@/app/components/ui/input";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import SubmitButton from "@/app/components/ui/SubmitButton";
import { Search } from "lucide-react";
import { createSection } from "./sections-actions";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";

type SectionRowClient = {
  id: string;
  title: string | null;
  visibility: KnowledgeVisibility;
  updatedAtMs: number;
};

function normalize(s: string) {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function SectionsSidebarClient({
  basePath,
  selectedId,
  companyId,
  sections,
}: {
  basePath: string;
  selectedId?: string;
  companyId: string;
  sections: SectionRowClient[];
}) {
  const [query, setQuery] = useState("");
  const [renderList, setRenderList] = useState<SectionRowClient[]>(sections);
  const [fadeState, setFadeState] = useState<"in" | "out">("in");
  const timerRef = useRef<number | null>(null);

  const [newOpen, setNewOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const router = useRouter();

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return sections;

    return sections.filter((s) => {
      const t = s.title ? normalize(s.title) : "";
      return t.includes(q);
    });
  }, [query, sections]);

  // Fade-out -> swap list -> fade-in (simple, fiable, sin dependencias)
  useEffect(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setFadeState("out");

    timerRef.current = window.setTimeout(() => {
      setRenderList(filtered);
      setFadeState("in");
      timerRef.current = null;
    }, 120);

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [filtered]);

  const listOpacityClass = fadeState === "in" ? "opacity-100" : "opacity-0";

  return (
    <aside className="h-full min-h-0 overflow-hidden flex flex-col">
      {/* Header centrado + botón + buscador */}
      <div className="px-4 pt-4 pb-3">
        <div className="ml-2">
          <div className="text-xl font-semibold text-slate-900">
            Secciones
          </div>
        </div>

        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={() => {
              setNewTitle("");
              setNewOpen(true);
            }}
            className={[
              "w-full max-w-[360px] h-10",
              "rounded-xl",
              "border border-dashed border-slate-300",
              "bg-white",
              "text-slate-600",
              "flex items-center justify-center gap-2",
              "transition-all duration-200",
              "hover:bg-white",
              "hover:border-slate-950 hover:border-solid hover:text-slate-950",
            ].join(" ")}
          >
            <span className="inline-flex items-center gap-2 transition-opacity duration-200">
              <span className="text-sm font-medium">+ Nueva sección</span>
            </span>
          </button>
        </div>

        {/* Línea centrada con márgenes iguales */}
        <div className="mt-3 flex justify-center">
          <div className="h-px w-full max-w-[360px] bg-slate-200/70" />
        </div>

        <div className="mt-3 flex justify-center">
          <div className="relative w-full max-w-[320px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar…"
              className={[
                "h-9 rounded-full",
                "border-transparent focus-visible:ring-0 focus-visible:ring-offset-0",
                "bg-slate-100",
                "pl-9 pr-9",
              ].join(" ")}
              autoComplete="off"
            />

            {query.length > 0 && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-500 hover:bg-slate-200/70 hover:text-slate-700"
                aria-label="Borrar búsqueda"
              >
                <span className="text-base leading-none">×</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal nueva sección */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Nueva sección</DialogTitle>
          </DialogHeader>

<form
  action={async (fd) => {
    const id = await createSection(fd);
    setNewOpen(false);
    // selección (ver parte B)
    router.push(`${basePath}?sectionId=${id}`);
  }}
  onSubmit={(e) => {
    if (newTitle.trim().length === 0) {
      e.preventDefault();
    }
  }}
  className="space-y-4"
>
  <input type="hidden" name="companyId" value={companyId} />
  <input type="hidden" name="visibility" value="PUBLIC" />

  <Input
    name="title"
    value={newTitle}
    onChange={(e) => setNewTitle(e.target.value)}
    placeholder="Nombre de la sección…"
    autoComplete="off"
    className="h-10"
    autoFocus
  />

  <DialogFooter>
    <Button
      type="button"
      variant="ghost"
      onClick={() => setNewOpen(false)}
    >
      Cancelar
    </Button>

    <div
      className={[
        newTitle.trim().length === 0 ? "opacity-50 pointer-events-none" : "",
      ].join(" ")}
    >
      <SubmitButton className="bg-slate-900 hover:bg-slate-950 text-white">
        Guardar
      </SubmitButton>
    </div>
  </DialogFooter>
</form>
        </DialogContent>
      </Dialog>

      {/* Lista */}
    <ScrollArea
      className={[
        "flex-1 min-h-0",
        "[&_[data-radix-scroll-area-viewport]]:[mask-image:linear-gradient(to_bottom,rgba(0,0,0,0)_0%,rgba(0,0,0,1)_4%,rgba(0,0,0,1)_96%,rgba(0,0,0,0)_100%)]",
        "[&_[data-radix-scroll-area-viewport]]:[-webkit-mask-image:linear-gradient(to_bottom,rgba(0,0,0,0)_0%,rgba(0,0,0,1)_4%,rgba(0,0,0,1)_96%,rgba(0,0,0,0)_100%)]",
      ].join(" ")}
    >
        <nav
          className={[
            "py-2",
            "px-4 pr-3",
            "transition-opacity duration-150",
            listOpacityClass,
          ].join(" ")}
        >
          {renderList.map((s) => {
            const isActive = selectedId === s.id;
            const isPublic = s.visibility === "PUBLIC";

            const leftBarClass = [
              "h-6 w-[3px] rounded-full",
              isActive
                ? "bg-slate-900"
                : "bg-transparent group-hover:bg-slate-200",
            ].join(" ");

            return (
              <Link
                key={s.id}
                href={`${basePath}?sectionId=${s.id}`}
                prefetch
                scroll={false}
                className="block"
              >
                <div
                  className={[
                    "group w-full rounded-xl px-3 py-2 transition-colors",
                    isActive ? "bg-slate-100" : "hover:bg-slate-50",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={leftBarClass} />

                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate text-slate-900">
                        {s.title || "(sin título)"}
                      </div>

                      <div className="mt-0.5 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>
                          {new Date(s.updatedAtMs).toLocaleDateString()}
                        </span>


                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}

          {!renderList.length && (
            <div className="py-6 text-sm text-muted-foreground text-center">
              No hay resultados.
            </div>
          )}
        </nav>
      </ScrollArea>
    </aside>
  );
}