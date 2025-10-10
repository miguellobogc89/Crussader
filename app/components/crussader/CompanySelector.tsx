// app/components/crussader/CompanySelector.tsx
"use client";

import { useMemo } from "react";
import { Building2, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

type CompanyLite = {
  id: string;
  name: string;
  color?: string | null;
  logoUrl?: string | null;
  locationsCount?: number;
};

export default function CompanySelector({
  companies,
  selectedCompanyId,
  onSelect,
  className = "",
}: {
  companies: CompanyLite[];
  selectedCompanyId?: string;
  onSelect: (id: string) => void;
  className?: string;
}) {
  const selected =
    useMemo(
      () => companies.find((c) => c.id === selectedCompanyId) ?? companies[0],
      [companies, selectedCompanyId]
    ) || null;

  const dotStyle =
    (selected?.color ?? "").toString() ||
    "linear-gradient(135deg, #A78BFA 0%, #F472B6 100%)";

  const hasMoreThanOne = (companies?.length ?? 0) > 1;

  const triggerClasses = `
    group inline-flex items-center gap-3
    rounded-xl border border-border/80 bg-background
    px-3.5 py-2 text-sm font-medium
    shadow-sm transition-all
    hover:shadow-md hover:border-foreground/30
    focus:outline-none focus-visible:ring-2 focus-visible:ring-ring
  `;

  // === Caso sin desplegable ===
  if (!hasMoreThanOne) {
    return (
      <div className={`flex items-center flex-wrap gap-3 ${className}`}>
        <button type="button" className={triggerClasses} aria-disabled disabled>
          <span
            aria-hidden
            className="h-3.5 w-3.5 rounded-full ring-1 ring-black/5"
            style={{
              background: dotStyle.startsWith("#") ? undefined : (dotStyle as string),
              backgroundColor: dotStyle.startsWith("#") ? dotStyle : undefined,
            }}
          />
          <span className="text-foreground/90">
            {selected ? selected.name : "Selecciona empresa"}
          </span>
          <ChevronDown className="h-4 w-4 text-foreground/40" />
        </button>

        <div className="rounded-md border bg-popover text-popover-foreground shadow-sm px-3 py-2">
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4" />
            <span className="font-medium">No tienes más empresas</span>
          </div>
        </div>
      </div>
    );
  }

  // === Caso con desplegable ===
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={`${triggerClasses} ${className}`}>
          <span
            aria-hidden
            className="h-3.5 w-3.5 rounded-full ring-1 ring-black/5"
            style={{
              background: dotStyle.startsWith("#") ? undefined : (dotStyle as string),
              backgroundColor: dotStyle.startsWith("#") ? dotStyle : undefined,
            }}
          />
          <span className="text-foreground/90">
            {selected ? selected.name : "Selecciona empresa"}
          </span>
          <ChevronDown className="h-4 w-4 text-foreground/50 group-hover:text-foreground/70 transition-colors" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Tus empresas
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {companies.map((c) => {
          const isActive = c.id === selected?.id;
          const bg = c.color ?? undefined;
          const isHex = typeof bg === "string" && bg.startsWith("#");

          return (
            <DropdownMenuItem
              key={c.id}
              className={`flex items-center gap-3 ${
                isActive ? "bg-violet-50 text-violet-900" : ""
              }`}
              onClick={() => onSelect(c.id)}
            >
              <span
                aria-hidden
                className="h-3 w-3 rounded-full ring-1 ring-black/5 shrink-0"
                style={{
                  background: bg && !isHex ? (bg as string) : undefined,
                  backgroundColor: bg && isHex ? (bg as string) : undefined,
                }}
              />
              <span className="flex-1 truncate">{c.name}</span>
              <span className="ml-2 tabular-nums text-xs text-muted-foreground shrink-0">
                ({c.locationsCount ?? 0})
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
