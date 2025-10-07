"use client";

import { useMemo } from "react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Building2, ChevronDown, Check } from "lucide-react";

export type CompanyLite = {
  id: string;
  name: string;
  color?: string | null;
  logoUrl?: string | null;
  locationsCount?: number;
};

export default function CompanyPicker({
  companies,
  selectedCompanyId,
  onSelect,
}: {
  companies: CompanyLite[];
  selectedCompanyId?: string | null;
  onSelect: (id: string) => void;
}) {
  const selected = useMemo(
    () => companies.find((c) => c.id === selectedCompanyId) ?? companies[0],
    [companies, selectedCompanyId]
  );

  const dot =
    (selected?.color ?? "").toString() ||
    "linear-gradient(135deg, #A78BFA 0%, #F472B6 100%)";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="group inline-flex items-center gap-3 rounded-full border border-border/80 bg-background px-3.5 py-2 text-sm font-medium shadow-sm hover:shadow transition-all hover:border-foreground/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span
            aria-hidden
            className="h-3.5 w-3.5 rounded-full ring-1 ring-black/5"
            style={{
              background: dot.startsWith("#") ? undefined : dot,
              backgroundColor: dot.startsWith("#") ? dot : undefined,
            }}
          />
          <span className="text-foreground/90">{selected ? selected.name : "Selecciona empresa"}</span>
          <ChevronDown className="h-4 w-4 text-foreground/50 group-hover:text-foreground/70 transition-colors" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Building2 className="h-4 w-4" /> Tus empresas
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {companies.length === 0 && <DropdownMenuItem disabled>Sin empresas</DropdownMenuItem>}
        {companies.map((c) => {
          const active = c.id === selected?.id;
          return (
            <DropdownMenuItem key={c.id} className="flex items-center gap-3" onClick={() => onSelect(c.id)}>
              <span
                aria-hidden
                className="h-3 w-3 rounded-full ring-1 ring-black/5 shrink-0"
                style={{
                  background: c.color && !c.color.startsWith("#") ? c.color : undefined,
                  backgroundColor: c.color && c.color.startsWith("#") ? c.color : undefined,
                }}
              />
              <span className="flex-1 truncate">{c.name}</span>
              <span className="ml-2 tabular-nums text-xs text-muted-foreground shrink-0">({c.locationsCount ?? 0})</span>
              {active && <Check className="ml-2 h-4 w-4 text-foreground/70 shrink-0" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
