"use client";

import * as React from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/app/components/ui/dropdown-menu";
import {
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Align, FilterKind, SortDir } from "./types";

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />;
  return dir === "asc"
    ? <ChevronUp className="h-4 w-4 text-foreground" />
    : <ChevronDown className="h-4 w-4 text-foreground" />;
}

export default function HeaderCell({
  label,
  align = "left",
  sortable = false,
  filter = "none",
  sortedActive,
  sortDir,
  onToggleSort,
  // filtros controlados por el padre
  textFilterValue,
  setTextFilterValue,
  booleanFilterValue,
  setBooleanFilterValue,
}: {
  label: string;
  align?: Align;
  sortable?: boolean;
  filter?: FilterKind;
  sortedActive?: boolean;
  sortDir?: SortDir;
  onToggleSort?: () => void;
  textFilterValue?: string;
  setTextFilterValue?: (v: string) => void;
  booleanFilterValue?: boolean | null;
  setBooleanFilterValue?: (v: boolean | null) => void;
}) {
  const center = align === "center";

  return (
    <th
      className={cn(
        "px-3 py-2 font-semibold select-none bg-muted/60",
        center ? "text-center" : "text-left"
      )}
      scope="col"
    >
      <div className={cn("inline-flex items-center gap-1", center && "justify-center")}>
        {sortable && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={onToggleSort}
            title={`Ordenar por ${label}`}
          >
            <SortIcon active={!!sortedActive} dir={sortDir ?? "asc"} />
          </Button>
        )}
        <span>{label}</span>
        {filter !== "none" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                title={`Filtrar ${label}`}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={center ? "center" : "start"} className="w-64 p-2">
              {filter === "text" && typeof textFilterValue !== "undefined" && setTextFilterValue && (
                <>
                  <div className="px-1 pb-2 text-xs text-muted-foreground">Contiene</div>
                  <div className="px-1 pb-2">
                    <Input
                      value={textFilterValue}
                      onChange={(e) => setTextFilterValue(e.target.value)}
                      placeholder={`Filtrar ${label.toLowerCase()}…`}
                    />
                  </div>
                </>
              )}

              {filter === "boolean" &&
                typeof booleanFilterValue !== "undefined" &&
                setBooleanFilterValue && (
                <>
                  <DropdownMenuItem onClick={() => setBooleanFilterValue(true)}>Solo activos</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setBooleanFilterValue(false)}>Solo inactivos</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setBooleanFilterValue(null)}>Quitar filtro</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </th>
  );
}
