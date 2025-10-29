// app/components/crussader/navigation/NavPagination.tsx
"use client";

import { useMemo, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

type PageSizeOption = number | string;

export type NavPagination = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;

  pageSize?: number;
  pageSizeOptions?: PageSizeOption[];
  onPageSizeChange?: (size: number) => void;

  className?: string;
  variant?: "default" | "ghost"; // ignorado para los números (forzamos estética custom)
};

function useSmartWindow(page: number, total: number, span = 1) {
  return useMemo<(number | "...")[]>(() => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages = new Set<number>();
    pages.add(1);
    pages.add(2);
    pages.add(total - 1);
    pages.add(total);

    for (let p = page - span; p <= page + span; p++) {
      if (p >= 1 && p <= total) pages.add(p);
    }

    const arr = Array.from(pages).sort((a, b) => a - b);
    const withDots: (number | "...")[] = [];
    for (let i = 0; i < arr.length; i++) {
      withDots.push(arr[i]);
      if (i < arr.length - 1 && arr[i + 1] !== arr[i] + 1) {
        withDots.push("...");
      }
    }
    return withDots;
  }, [page, total, span]);
}

export default function NavPagination({
  page,
  totalPages,
  onPageChange,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
  className,
}: NavPagination) {
  const [jump, setJump] = useState<string>("");

  const items = useSmartWindow(page, totalPages, 1);
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const go = (p: number) => {
    const safe = Math.min(Math.max(1, p), totalPages || 1);
    if (safe !== page) onPageChange(safe);
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      {/* Izquierda: selector de tamaño */}
      {onPageSizeChange && pageSizeOptions && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:inline">
            Por página
          </span>
          <Select
            value={String(pageSize ?? pageSizeOptions[0])}
            onValueChange={(v) => onPageSizeChange(Number(v))}
          >
            <SelectTrigger className="h-9 w-[110px] bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((opt) => (
                <SelectItem key={String(opt)} value={String(opt)}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Centro: botones de paginación */}
      <div className="flex items-center justify-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={() => go(1)}
          disabled={!canPrev}
          aria-label="Primera página"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={() => go(page - 1)}
          disabled={!canPrev}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {items.map((it, idx) =>
          it === "..." ? (
            <span
              key={`dots-${idx}`}
              className="px-2 text-muted-foreground select-none"
              aria-hidden
            >
              <MoreHorizontal className="h-4 w-4" />
            </span>
          ) : (
            <Button
              key={it}
              // Forzamos "ghost" y personalizamos la estética de activos/inactivos por clase
              variant="ghost"
              size="sm"
              className={cn(
                "h-9 w-9 p-0 transition-colors",
                // Inactivo: blanco puro con hover sutil
                "bg-white hover:bg-muted",
                // Activo: NO relleno morado; ring + fondo tenue + texto primary
                it === page &&
                  "bg-primary/10 text-primary ring-1 ring-primary/30 hover:bg-primary/10"
              )}
              onClick={() => go(it)}
              aria-current={it === page ? "page" : undefined}
              aria-label={`Página ${it}`}
            >
              {it}
            </Button>
          )
        )}

        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={() => go(page + 1)}
          disabled={!canNext}
          aria-label="Página siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={() => go(totalPages)}
          disabled={!canNext}
          aria-label="Última página"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Derecha: salto a página */}
      <div className="flex items-center justify-end gap-2">
        <span className="text-sm text-muted-foreground hidden sm:inline">
          Página
        </span>
        <Input
          value={jump}
          onChange={(e) => setJump(e.target.value.replace(/[^\d]/g, ""))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && jump) {
              go(Number(jump));
              setJump("");
            }
          }}
          placeholder={`${page}/${Math.max(totalPages, 1)}`}
          className="h-9 w-20 bg-background"
          inputMode="numeric"
          aria-label="Ir a página"
        />
        <Button
          variant="outline"
          className="h-9"
          onClick={() => {
            if (jump) {
              go(Number(jump));
              setJump("");
            }
          }}
          disabled={!jump}
        >
          Ir
        </Button>
      </div>
    </div>
  );
}
