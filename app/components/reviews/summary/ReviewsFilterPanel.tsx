// app/components/reviews/summary/ReviewsFilterPanel.tsx
"use client";

import { useMemo } from "react";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  RotateCcw,
} from "lucide-react";

export type SortOption = "date-desc" | "date-asc" | "rating-desc" | "rating-asc";
export type DateRange = "1m" | "3m" | "6m" | "1y" | "all";

type Props = {
  locationSelectorSlot?: React.ReactNode;

  dateRange: DateRange;
  onChangeDateRange: (v: DateRange) => void;

  searchQuery: string;
  onChangeSearchQuery: (v: string) => void;

  sortBy: SortOption;
  onChangeSortBy: (v: SortOption) => void;

  showUnresponded: boolean;
  onToggleUnresponded: (v: boolean) => void;

  showResponded: boolean;
  onToggleResponded: (v: boolean) => void;

  selectedStars: Set<number>;
  onToggleStar: (star: number) => void;

  onClearAllFilters: () => void;

  onRefresh?: () => void;
  refreshDisabled?: boolean;
};

export default function ReviewsFilterPanel({
  locationSelectorSlot,

  dateRange,
  onChangeDateRange,

  searchQuery,
  onChangeSearchQuery,

  sortBy,
  onChangeSortBy,

  showUnresponded,
  onToggleUnresponded,

  showResponded,
  onToggleResponded,

  selectedStars,
  onToggleStar,

  onClearAllFilters,

  onRefresh,
  refreshDisabled,
}: Props) {
  const activeFiltersCount = useMemo(
    () => (showUnresponded ? 1 : 0) + (showResponded ? 1 : 0) + selectedStars.size,
    [showUnresponded, showResponded, selectedStars]
  );

  return (
    <div className="bg-card border border-border rounded-lg p-3 sm:p-4 md:p-6 bg-dark">
      {/* móvil: columnas; sm: fila con wrap; md+: fila sin wrap */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        {/* Location selector:
            - móvil: full width
            - sm+: flex-1 con min/max para equilibrar con resto
        */}
        {locationSelectorSlot && (
          <div className="h-9 flex w-full items-center sm:flex-1 sm:min-w-[180px] sm:max-w-[320px] md:max-w-[360px]">
            {locationSelectorSlot}
          </div>
        )}

        {/* Fecha + filtros + ordenar + refrescar */}
        <div className="flex w-full items-center gap-2 sm:w-auto sm:gap-3 sm:ml-auto">
          {/* Fecha: flex-1 con min/max */}
          <div className="flex-1 min-w-[140px] max-w-[200px]">
            <Select
              value={dateRange}
              onValueChange={(v) => onChangeDateRange(v as DateRange)}
            >
              <SelectTrigger className="h-9 w-full bg-background">
                <SelectValue placeholder="Fecha" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">Último mes</SelectItem>
                <SelectItem value="3m">Últimos 3 meses</SelectItem>
                <SelectItem value="6m">Últimos 6 meses</SelectItem>
                <SelectItem value="1y">Último año</SelectItem>
                <SelectItem value="all">Siempre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtros */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/70 bg-background transition-colors hover:bg-muted"
                title="Filtros"
                aria-label="Filtros"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Estado de respuesta</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={showUnresponded}
                onCheckedChange={(v) => onToggleUnresponded(Boolean(v))}
              >
                Sin responder
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showResponded}
                onCheckedChange={(v) => onToggleResponded(Boolean(v))}
              >
                Respondidas
              </DropdownMenuCheckboxItem>

              <DropdownMenuSeparator />
              <DropdownMenuLabel>Calificación</DropdownMenuLabel>
              {[5, 4, 3, 2, 1].map((star) => (
                <DropdownMenuCheckboxItem
                  key={star}
                  checked={selectedStars.has(star)}
                  onCheckedChange={() => onToggleStar(star)}
                >
                  <span className="flex items-center gap-2">
                    {star} {star === 1 ? "estrella" : "estrellas"}
                    <span className="text-yellow-500">{"⭐".repeat(star)}</span>
                  </span>
                </DropdownMenuCheckboxItem>
              ))}

              {activeFiltersCount > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <button
                    className="w-full px-2 py-1.5 text-left text-sm text-muted-foreground hover:text-foreground"
                    onClick={onClearAllFilters}
                  >
                    Limpiar todo
                  </button>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Ordenar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/70 bg-background transition-colors hover:bg-muted"
                title="Ordenar"
                aria-label="Ordenar"
              >
                <ArrowUpDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={sortBy === "date-desc"}
                onCheckedChange={() => onChangeSortBy("date-desc")}
              >
                Fecha (más reciente)
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortBy === "date-asc"}
                onCheckedChange={() => onChangeSortBy("date-asc")}
              >
                Fecha (más antigua)
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={sortBy === "rating-desc"}
                onCheckedChange={() => onChangeSortBy("rating-desc")}
              >
                Rating (mayor a menor)
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortBy === "rating-asc"}
                onCheckedChange={() => onChangeSortBy("rating-asc")}
              >
                Rating (menor a mayor)
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Actualizar */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshDisabled}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/70 bg-background transition-colors hover:bg-muted disabled:opacity-50"
            title="Actualizar"
            aria-label="Actualizar"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {/* Buscador:
            - móvil: full width
            - sm+: flex-1 con min/max (para equilibrarlo con fecha y location)
        */}
        <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-[360px] md:max-w-[420px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Autor o contenido…"
            value={searchQuery}
            onChange={(e) => onChangeSearchQuery(e.target.value)}
            className="h-9 w-full bg-background pl-10"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onChangeSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Borrar búsqueda"
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
