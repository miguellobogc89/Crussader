// app/components/crussader/UX/RangePicklist.tsx
"use client";

import { Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/app/components/ui/select";

export type RangePreset = "1m" | "3m" | "1y" | "all";

const DEFAULT_ITEMS: Array<{ id: RangePreset; label: string }> = [
  { id: "1m", label: "Último mes" },
  { id: "3m", label: "Últimos 3 meses" },
  { id: "1y", label: "Último año" },
  { id: "all", label: "Siempre" },
];

export default function RangePicklist({
  value,
  onChange,
  items = DEFAULT_ITEMS,
  className,
}: {
  value: RangePreset;
  onChange: (v: RangePreset) => void;
  items?: Array<{ id: RangePreset; label: string }>;
  className?: string;
}) {
  const current = items.find((i) => i.id === value)?.label ?? "";

  return (
    <Select value={value} onValueChange={(v) => onChange(v as RangePreset)}>
<SelectTrigger
  className={[
    `
      h-9 sm:h-10 rounded-2xl
      bg-white/80 backdrop-blur-sm
      border border-slate-200 shadow-sm
      px-3 hover:bg-white
      w-auto
      min-w-[44px] sm:min-w-[190px] sm:max-w-[220px]
      focus:ring-0 focus:ring-offset-0 focus:outline-none
    `,
    className ?? "",
  ].join(" ")}
>

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-600" />
          <span className="hidden sm:block text-xs font-semibold text-slate-700">
            {current}
          </span>
        </div>
      </SelectTrigger>

      <SelectContent align="start">
        {items.map((it) => (
          <SelectItem key={it.id} value={it.id}>
            {it.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
