// app/components/admin/integrations/whatsapp/templates/TemplatesShell.tsx
"use client";

import { useMemo, useState } from "react";
import type { TemplateFilters, WaTemplate } from "./types";
import TemplatesListPanel from "./TemplatesListPanel";
import TemplateDetailsPanel from "./TemplateDetailsPanel";

const DEFAULT_FILTERS: TemplateFilters = {
  q: "",
  status: "all",
  category: "all",
  lang: "all",
};

export default function TemplatesShell({
  items,
  loading,
  selected,
  selectedId,
  onSelect,
  onRefresh,
  languages,
  onToggleFavorite,
}: {
  items: WaTemplate[];
  loading: boolean;
  selected: WaTemplate | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRefresh: () => void;
  languages: string[];
  onToggleFavorite: (templateId: string, next: boolean) => void;
}) {
  const [filters, setFilters] = useState<TemplateFilters>(DEFAULT_FILTERS);

  const normalizedLangs = useMemo(() => {
    const set = new Set(languages);
    return Array.from(set).sort();
  }, [languages]);

  return (
    <div className="h-[calc(100vh-220px)] min-h-[720px]">
      <div className="grid h-full grid-cols-1 gap-3 lg:grid-cols-[520px_1fr]">
        <TemplatesListPanel
          items={items}
          loading={loading}
          selectedId={selectedId}
          onSelect={onSelect}
          filters={filters}
          onChangeFilters={setFilters}
          languages={normalizedLangs}
          onRefresh={onRefresh}
          onToggleFavorite={onToggleFavorite}
        />

        <TemplateDetailsPanel selected={selected} />
      </div>
    </div>
  );
}