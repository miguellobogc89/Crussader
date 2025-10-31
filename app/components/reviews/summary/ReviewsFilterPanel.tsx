"use client";

import { useMemo } from "react";
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
  Calendar,
  RotateCcw,
} from "lucide-react";

export type SortOption = "date-desc" | "date-asc" | "rating-desc" | "rating-asc";
export type DateRange = "1m" | "3m" | "6m" | "1y" | "all";

type Props = {
  /** ⬅️ Pásame aquí tu <LocationSelector .../> */
  locationSelectorSlot?: React.ReactNode;

  // Fecha
  dateRange: DateRange;
  onChangeDateRange: (v: DateRange) => void;

  // Búsqueda
  searchQuery: string;
  onChangeSearchQuery: (v: string) => void;

  // Orden
  sortBy: SortOption;
  onChangeSortBy: (v: SortOption) => void;

  // Filtros extra
  showUnresponded: boolean;
  onToggleUnresponded: (v: boolean) => void;

  showResponded: boolean;
  onToggleResponded: (v: boolean) => void;

  selectedStars: Set<number>;
  onToggleStar: (star: number) => void;

  onClearAllFilters: () => void;

  // Refresco
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
      {/* ÚNICA LÍNEA; wrap en pantallas pequeñas */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* ⬅️ Location selector (slot) */}
        {locationSelectorSlot && (
          <div className="h-9 flex items-center">
            {locationSelectorSlot}
          </div>
        )}

        {/* 📅 Fecha */}
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center justify-center rounded-md h-9 w-9 border border-border/70 bg-background"
            title="Fecha"
            aria-hidden="true"
          >
            <Calendar className="w-4 h-4" />
          </span>
          <Select value={dateRange} onValueChange={(v) => onChangeDateRange(v as DateRange)}>
            <SelectTrigger className="h-9 w-[140px] sm:w-[160px] bg-background">
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

        {/* 🧰 Filtros */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md h-9 w-9 border border-border/70 bg-background hover:bg-muted transition-colors"
              title="Filtros"
              aria-label="Filtros"
            >
              <SlidersHorizontal className="w-4 h-4" />
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
                  className="w-full text-left px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                  onClick={onClearAllFilters}
                >
                  Limpiar todo
                </button>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* ↕️ Ordenar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md h-9 w-9 border border-border/70 bg-background hover:bg-muted transition-colors"
              title="Ordenar"
              aria-label="Ordenar"
            >
              <ArrowUpDown className="w-4 h-4" />
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

        {/* ⟳ Actualizar */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshDisabled}
          className="inline-flex items-center justify-center rounded-md h-9 w-9 border border-border/70 bg-background hover:bg-muted transition-colors disabled:opacity-50"
          title="Actualizar"
          aria-label="Actualizar"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* 🔍 Buscar (acortada) */}
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Autor o contenido…"
            value={searchQuery}
            onChange={(e) => onChangeSearchQuery(e.target.value)}
            className="pl-10 h-9 bg-background w-[220px] sm:w-[260px] md:w-[320px] max-w-[320px]"
          />
        </div>
      </div>
    </div>
  );
}
