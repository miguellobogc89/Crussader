// app/components/admin/integrations/whatsapp/templates/TemplatesListPanel.tsx
"use client";

import { useMemo } from "react";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Search, RefreshCw } from "lucide-react";

import type {
  TemplateFilters,
  WaTemplate,
} from "./types";

function statusLabel(status: string) {
  if (status === "approved") return "Aprobada";
  if (status === "pending") return "En revisión";
  if (status === "rejected") return "Rechazada";
  return "Borrador";
}

function statusDot(status: string) {
  if (status === "approved") return "bg-emerald-500";
  if (status === "pending") return "bg-amber-500";
  if (status === "rejected") return "bg-rose-500";
  return "bg-slate-400";
}

function cleanName(name: string) {
  return name.replaceAll("_", " ");
}

export default function TemplatesListPanel({
  items,
  loading,
  selectedId,
  onSelect,
  filters,
  onChangeFilters,
  onRefresh,
  onSync,
}: {
  items: WaTemplate[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  filters: TemplateFilters;
  onChangeFilters: (next: TemplateFilters) => void;
  languages: string[];
  onRefresh: () => void;
  onSync: () => void | Promise<void>;
  onToggleFavorite: (templateId: string, next: boolean) => void;
}) {
  const filtered = useMemo(() => {
    const query = filters.q.trim().toLowerCase();

    return items
      .filter((template) => {
        if (template.name.includes("hello_world")) return false;

        if (filters.status !== "all" && template.status !== filters.status) {
          return false;
        }

        if (filters.category !== "all" && template.category !== filters.category) {
          return false;
        }

        if (filters.lang !== "all" && template.language !== filters.lang) {
          return false;
        }

        if (!query) return true;

        const haystack = `${template.title} ${template.name} ${template.body}`.toLowerCase();
        return haystack.includes(query);
      })
      .sort((a, b) => {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [items, filters]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex h-[102px] shrink-0 flex-col justify-center border-b border-slate-200 px-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Plantillas
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Mensajes aprobados para WhatsApp.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onSync}
              disabled={loading}
              title="Actualizar plantillas"
              className="h-9 w-9 rounded-xl"
            >
              <RefreshCw className={["h-4 w-4", loading ? "animate-spin" : ""].join(" ")} />
            </Button>

          </div>
        </div>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />

          <Input
            value={filters.q}
            onChange={(event) => onChangeFilters({ ...filters, q: event.target.value })}
            placeholder="Buscar plantilla..."
            className="h-10 rounded-xl border-slate-200 bg-slate-50 pl-9 text-sm shadow-none focus-visible:ring-0"
            disabled={loading && items.length === 0}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-2">
        {loading && items.length === 0 ? (
          <div className="p-4 text-sm text-slate-500">
            Cargando plantillas...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-sm text-slate-500">
            No hay plantillas disponibles.
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map((template) => {
              const active = template.id === selectedId;

              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => onSelect(template.id)}
                  className={[
                    "w-full rounded-xl px-3 py-3 text-left transition-colors",
                    active
                      ? "bg-blue-50 ring-1 ring-blue-200"
                      : "bg-white hover:bg-slate-50",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {template.title || cleanName(template.name)}
                      </p>

                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                        {template.body}
                      </p>

                      <div className="mt-2 flex items-center gap-2">
                        <span className={["h-2 w-2 rounded-full", statusDot(template.status)].join(" ")} />

                        <span className="text-[11px] font-medium text-slate-500">
                          {statusLabel(template.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}