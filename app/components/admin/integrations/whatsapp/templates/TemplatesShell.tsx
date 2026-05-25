// app/components/admin/integrations/whatsapp/templates/TemplatesShell.tsx
"use client";

import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import TemplatesAddDialog from "./TemplatesAddDialog";
import type { TemplateFilters, WaTemplate } from "./types";
import TemplatesListPanel from "./TemplatesListPanel";
import TemplateDetailsPanel from "./TemplateDetailsPanel";

const DEFAULT_FILTERS: TemplateFilters = {
  q: "",
  status: "all",
  category: "all",
  lang: "all",
};

type TemplatesShellProps = {
  items: WaTemplate[];
  loading: boolean;
  selected: WaTemplate | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRefresh: () => void | Promise<void>;
  onSync: () => void | Promise<void>;
  languages: string[];
  onToggleFavorite: (templateId: string, next: boolean) => void | Promise<void>;
};

function countByStatus(items: WaTemplate[], status: string) {
  return items.filter((item) => item.status === status).length;
}

function KpiPill({
  label,
  value,
  active,
  dotClassName,
  onClick,
}: {
  label: string;
  value: number;
  active: boolean;
  dotClassName?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex h-8 items-center gap-2 rounded-full px-3 text-xs font-medium transition",
        active
          ? "bg-slate-950 text-white shadow-sm"
          : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50",
      ].join(" ")}
    >
      {dotClassName ? (
        <span className={["h-1.5 w-1.5 rounded-full", dotClassName].join(" ")} />
      ) : null}

      <span>{label}</span>

      <span className="font-semibold tabular-nums">
        {value}
      </span>
    </button>
  );
}

export default function TemplatesShell({
  items,
  loading,
  selected,
  selectedId,
  onSelect,
  onRefresh,
  onSync,
  languages,
  onToggleFavorite,
}: TemplatesShellProps) {
  const [filters, setFilters] = useState<TemplateFilters>(DEFAULT_FILTERS);

  const normalizedLangs = useMemo(() => {
    const set = new Set(languages);
    return Array.from(set).sort();
  }, [languages]);

  const visibleItems = useMemo(() => {
    return items.filter((item) => !item.name.includes("hello_world"));
  }, [items]);

  const counts = useMemo(() => {
    return {
      total: visibleItems.length,
      approved: countByStatus(visibleItems, "approved"),
      pending: countByStatus(visibleItems, "pending"),
      rejected: countByStatus(visibleItems, "rejected"),
    };
  }, [visibleItems]);

  return (
    <div className="flex h-[calc(100vh-180px)] min-h-[720px] flex-col">
      <div className="shrink-0 px-1 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-950">
              Plantillas de WhatsApp
            </h1>
          </div>

          <TemplatesAddDialog onCreated={onRefresh} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <KpiPill
            label="Total"
            value={counts.total}
            active={filters.status === "all"}
            onClick={() => setFilters({ ...filters, status: "all" })}
          />

          <KpiPill
            label="Aprobadas"
            value={counts.approved}
            active={filters.status === "approved"}
            dotClassName="bg-emerald-500"
            onClick={() => setFilters({ ...filters, status: "approved" })}
          />

          <KpiPill
            label="En revisión"
            value={counts.pending}
            active={filters.status === "pending"}
            dotClassName="bg-amber-500"
            onClick={() => setFilters({ ...filters, status: "pending" })}
          />

          <KpiPill
            label="Rechazadas"
            value={counts.rejected}
            active={filters.status === "rejected"}
            dotClassName="bg-rose-500"
            onClick={() => setFilters({ ...filters, status: "rejected" })}
          />

        </div>
      </div>

      <section className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid h-full grid-cols-1 lg:grid-cols-[420px_1fr]">
          <aside className="min-h-0 border-r border-slate-200 bg-white">
            <TemplatesListPanel
              items={visibleItems}
              loading={loading}
              selectedId={selectedId}
              onSelect={onSelect}
              filters={filters}
              onChangeFilters={setFilters}
              languages={normalizedLangs}
              onRefresh={onRefresh}
              onSync={onSync}
              onToggleFavorite={onToggleFavorite}
            />
          </aside>

          <main className="min-h-0 bg-[#f8fafc]">
            <TemplateDetailsPanel
  selected={
    selected && !selected.name.includes("hello_world")
      ? selected
      : visibleItems[0] ?? null
  }
/>
          </main>
        </div>
      </section>
    </div>
  );
}