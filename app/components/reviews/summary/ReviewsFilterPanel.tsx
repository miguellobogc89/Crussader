"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Badge } from "@/app/components/ui/badge";
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
  ChevronDown,
} from "lucide-react";

export type SortOption = "date-desc" | "date-asc" | "rating-desc" | "rating-asc";
export type DateRange = "1m" | "3m" | "6m" | "1y" | "all";

type Props = {
  // Contadores
  shownCount: number;
  totalCount: number;

  // Límite de tiempo
  dateRange: DateRange;
  onChangeDateRange: (v: DateRange) => void;

  // Paginación visual
  reviewsPerPage: string;
  onChangeReviewsPerPage: (v: string) => void;

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
};

export default function ReviewsFilterPanel({
  shownCount,
  totalCount,

  dateRange,
  onChangeDateRange,

  reviewsPerPage,
  onChangeReviewsPerPage,

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
}: Props) {
  const activeFiltersCount = useMemo(() => {
    // Si quieres que contar la fecha como filtro cuando != "all", suma +(dateRange !== "all" ? 1 : 0)
    return (showUnresponded ? 1 : 0) + (showResponded ? 1 : 0) + selectedStars.size;
  }, [showUnresponded, showResponded, selectedStars]);

  // --- Colapsable ---
  const [collapsed, setCollapsed] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [maxH, setMaxH] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (contentRef.current) {
      setMaxH(contentRef.current.scrollHeight);
    }
  }, [
    collapsed,
    dateRange,
    reviewsPerPage,
    searchQuery,
    sortBy,
    showUnresponded,
    showResponded,
    selectedStars.size,
  ]);

  const dateRangeLabel = useMemo(() => {
    switch (dateRange) {
      case "1m": return "Último mes";
      case "3m": return "Últimos 3 meses";
      case "6m": return "Últimos 6 meses";
      case "1y": return "Último año";
      default: return "Siempre";
    }
  }, [dateRange]);

  return (
    <div className="bg-card border border-border rounded-lg p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
      {/* Header compacto siempre visible */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-sm text-muted-foreground truncate">
            Mostrando{" "}
            <span className="font-semibold text-foreground">{shownCount}</span> de{" "}
            <span className="font-semibold text-foreground">{totalCount}</span>
          </p>

          {/* Resumen fecha */}
          <span className="hidden xs:inline text-xs text-muted-foreground/90 px-2 py-0.5 rounded-full bg-muted">
            <Calendar className="inline-block w-3.5 h-3.5 mr-1" />
            {dateRangeLabel}
          </span>

          {/* Nº filtros activos */}
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="text-[11px] px-2 py-0.5">
              {activeFiltersCount} filtro{activeFiltersCount === 1 ? "" : "s"}
            </Badge>
          )}
        </div>

        <div className="ml-auto">
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="
              inline-flex items-center justify-center rounded-md border border-border/70
              h-8 w-8 bg-background hover:bg-muted transition-colors
            "
            aria-label={collapsed ? "Expandir filtros" : "Colapsar filtros"}
            aria-expanded={!collapsed}
            aria-controls="reviews-filters-panel"
            title={collapsed ? "Expandir" : "Colapsar"}
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform ${collapsed ? "" : "rotate-180"}`}
            />
          </button>
        </div>
      </div>

      {/* Contenido expandible */}
      <div
        id="reviews-filters-panel"
        ref={contentRef}
        className={`
          transition-[max-height,opacity,margin] duration-300 ease-out overflow-hidden
          ${collapsed ? "opacity-0 -mt-1" : "opacity-100 mt-1"}
        `}
        style={{ maxHeight: collapsed ? 0 : maxH }}
        aria-hidden={collapsed}
      >
        <div className="space-y-4 sm:space-y-5">
          {/* Fila 1: Fecha / Por página / Buscar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* Fecha */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Fecha
              </label>
              <Select
                value={dateRange}
                onValueChange={(v) => onChangeDateRange(v as DateRange)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Rango de fechas" />
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

            {/* Mostrar por página */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                Mostrar por página
              </label>
              <Select value={reviewsPerPage} onValueChange={onChangeReviewsPerPage}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 reseñas</SelectItem>
                  <SelectItem value="12">12 reseñas</SelectItem>
                  <SelectItem value="24">24 reseñas</SelectItem>
                  <SelectItem value="48">48 reseñas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Buscar */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por autor o contenido..."
                  value={searchQuery}
                  onChange={(e) => onChangeSearchQuery(e.target.value)}
                  className="pl-10 bg-background"
                />
              </div>
            </div>
          </div>

          {/* Fila 2: Filtros y Orden */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Filtros */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <SlidersHorizontal className="w-4 h-4" />
                  Filtros
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
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
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Orden */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowUpDown className="w-4 h-4" />
                  Ordenar
                </Button>
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

            {/* Pills de filtros activos */}
            {activeFiltersCount > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="hidden sm:inline text-sm text-muted-foreground">
                  Filtros activos:
                </span>
                {showUnresponded && (
                  <Badge variant="secondary" className="gap-1">
                    Sin responder
                    <button
                      onClick={() => onToggleUnresponded(false)}
                      className="ml-1 hover:text-destructive"
                      title="Quitar filtro"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {showResponded && (
                  <Badge variant="secondary" className="gap-1">
                    Respondidas
                    <button
                      onClick={() => onToggleResponded(false)}
                      className="ml-1 hover:text-destructive"
                      title="Quitar filtro"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {Array.from(selectedStars).map((star) => (
                  <Badge key={star} variant="secondary" className="gap-1">
                    {star}⭐
                    <button
                      onClick={() => onToggleStar(star)}
                      className="ml-1 hover:text-destructive"
                      title="Quitar filtro"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearAllFilters}
                  className="text-xs h-7"
                  title="Limpiar todas los filtros"
                >
                  Limpiar todo
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
