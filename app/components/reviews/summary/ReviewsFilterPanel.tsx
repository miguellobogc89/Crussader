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
  Calendar,
} from "lucide-react";

export type SortOption = "date-desc" | "date-asc" | "rating-desc" | "rating-asc";
export type DateRange = "1m" | "3m" | "6m" | "1y" | "all";

type Props = {
  locationSelectorSlot?: React.ReactNode;

  searchQuery: string;
  onChangeSearchQuery: (v: string) => void;

  onRefresh?: () => void;
  refreshDisabled?: boolean;

  dateRange: DateRange;
  onChangeDateRange: (v: DateRange) => void;

  sortBy: SortOption;
  onChangeSortBy: (v: SortOption) => void;

  showUnresponded: boolean;
  onToggleUnresponded: (v: boolean) => void;

  showResponded: boolean;
  onToggleResponded: (v: boolean) => void;

  showPublishedOnly: boolean;
  onTogglePublishedOnly: (v: boolean) => void;

  selectedStars: Set<number>;
  onToggleStar: (star: number) => void;

  onClearAllFilters: () => void;
};

export default function ReviewsFilterPanel({
  searchQuery,
  onChangeSearchQuery,

  onRefresh,
  refreshDisabled,

  dateRange,
  onChangeDateRange,

  sortBy,
  onChangeSortBy,

  showUnresponded,
  onToggleUnresponded,

  showResponded,
  onToggleResponded,

  showPublishedOnly,
  onTogglePublishedOnly,

  selectedStars,
  onToggleStar,

  onClearAllFilters,
}: Props) {
  const activeFiltersCount = useMemo(() => {
    return (
      (showUnresponded ? 1 : 0) +
      (showResponded ? 1 : 0) +
      (showPublishedOnly ? 1 : 0) +
      selectedStars.size
    );
  }, [showUnresponded, showResponded, showPublishedOnly, selectedStars]);

  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <div className="rounded-2xl bg-white/70 backdrop-blur-sm space-y-3 pl-1 sm:pl-0">
      <div className="flex flex-wrap items-center gap-2">
        {/* 1) Search primero */}
        <div className="relative flex-1 min-w-[150px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <Input
            placeholder="Buscar por autor o contenido…"
            value={searchQuery}
            onChange={(e) => onChangeSearchQuery(e.target.value)}
            className="
              h-9 sm:h-10 w-full bg-white pl-10 pr-8
              text-xs sm:text-sm xl:text-xs xl2:text-sm

              border border-slate-300
              outline-none
              ring-0 ring-offset-0

              focus:outline-none
              focus:ring-0 focus:ring-offset-0
              focus-visible:outline-none
              focus-visible:ring-0 focus-visible:ring-offset-0
              focus-visible:border-slate-300

              overflow-hidden text-ellipsis whitespace-nowrap
            "
          />

          {searchQuery ? (
            <button
              type="button"
              onClick={() => onChangeSearchQuery("")}
              className="
                absolute right-2 top-1/2 -translate-y-1/2
                text-slate-400 transition-colors hover:text-slate-700
              "
              aria-label="Borrar búsqueda"
            >
              ×
            </button>
          ) : null}
        </div>


        {/* 2) Botón rango de fecha como icono calendario */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-white
                         text-slate-800 transition-colors hover:bg-slate-50 border"
              aria-label="Rango de fechas"
              title="Rango de fechas"
            >
              <Calendar className="h-4 w-4 text-slate-700" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Rango de fechas</DropdownMenuLabel>

            <DropdownMenuCheckboxItem
              checked={dateRange === "1m"}
              onCheckedChange={() => onChangeDateRange("1m")}
            >
              Último mes
            </DropdownMenuCheckboxItem>

            <DropdownMenuCheckboxItem
              checked={dateRange === "3m"}
              onCheckedChange={() => onChangeDateRange("3m")}
            >
              Últimos 3 meses
            </DropdownMenuCheckboxItem>

            <DropdownMenuCheckboxItem
              checked={dateRange === "6m"}
              onCheckedChange={() => onChangeDateRange("6m")}
            >
              Últimos 6 meses
            </DropdownMenuCheckboxItem>

            <DropdownMenuCheckboxItem
              checked={dateRange === "1y"}
              onCheckedChange={() => onChangeDateRange("1y")}
            >
              Último año
            </DropdownMenuCheckboxItem>

            <DropdownMenuCheckboxItem
              checked={dateRange === "all"}
              onCheckedChange={() => onChangeDateRange("all")}
            >
              Siempre
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 3) Filters */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="relative inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-white
                         text-slate-800 transition-colors hover:bg-slate-50 border"
              aria-label="Filtros"
              title="Filtros"
            >
              <SlidersHorizontal className="h-4 w-4 text-slate-700" />
              {hasActiveFilters ? (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-slate-900" />
              ) : null}
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-64">
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

            <DropdownMenuCheckboxItem
              checked={showPublishedOnly}
              onCheckedChange={(v) => onTogglePublishedOnly(Boolean(v))}
            >
              Solo publicadas
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

            {hasActiveFilters ? (
              <>
                <DropdownMenuSeparator />
                <button
                  type="button"
                  className="w-full px-2 py-1.5 text-left text-sm text-slate-500 hover:text-slate-900"
                  onClick={onClearAllFilters}
                >
                  Limpiar todo
                </button>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 4) Sort */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-white
                         text-slate-800 transition-colors hover:bg-slate-50 border"
              aria-label="Ordenar"
              title="Ordenar"
            >
              <ArrowUpDown className="h-4 w-4 text-slate-700" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-60">
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

        {/* 5) Refresh */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshDisabled}
          className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl
                    bg-white text-slate-700 transition-colors hover:bg-slate-50
                    disabled:opacity-50 border"
          title="Actualizar"
          aria-label="Actualizar"
        >
          <RotateCcw
            className={[
              "h-4 w-4",
              refreshDisabled ? "animate-spin [animation-direction:reverse]" : "",
            ].join(" ")}
          />
        </button>
      
      </div>
    </div>
  );
}
