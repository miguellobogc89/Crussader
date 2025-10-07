"use client";

import { ArrowDownWideNarrow } from "lucide-react";

export type SortKey = "newest" | "oldest" | "rating_desc" | "rating_asc";

type Props = {
  value: SortKey;
  onChange: (v: SortKey) => void;
};

export default function SortSelect({ value, onChange }: Props) {
  return (
    <div className="inline-flex items-center gap-2">
      <ArrowDownWideNarrow className="h-4 w-4 text-muted-foreground" />
      <select
        aria-label="Ordenar"
        className="rounded-md border border-border/70 bg-background px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
      >
        <option value="newest">Más recientes</option>
        <option value="oldest">Más antiguas</option>
        <option value="rating_desc">Mejor rating</option>
        <option value="rating_asc">Peor rating</option>
      </select>
    </div>
  );
}
