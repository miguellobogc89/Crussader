"use client";

import { useMemo } from "react";
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
import { Search, SlidersHorizontal, ArrowUpDown, Calendar } from "lucide-react";

export type SortOption = "date-desc" | "date-asc" | "rating-desc" | "rating-asc";
export type DateRange = "1m" | "3m" | "6m" | "1y" | "all";

type Props = {
  // Contadores
  shownCount: number;
  totalCount: number;

  // 🔄 Nuevo: límite de tiempo (sustituye a Ubicación)
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
    // Nota: si quieres contar el filtro de fecha como “activo” cuando != "all",
    // suma +(dateRange !== "all" ? 1 : 0)
    return (showUnresponded ? 1 : 0) + (showResponded ? 1 : 0) + selectedStars.size;
  }, [showUnresponded, showResponded, selectedStars]);

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      {/* Fila 1: Límite de tiempo / Por página / Buscar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 🔄 Límite de tiempo (picklist) */}
        <div className="space-y-2">
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
        <div className="space-y-2">
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
        <div className="space-y-2">
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
      <div className="flex flex-wrap items-center gap-3">
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

        {/* Pills de filtros activos (mantenemos igual) */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-muted-foreground">Filtros activos:</span>
            {showUnresponded && (
              <Badge variant="secondary" className="gap-1">
                Sin responder
                <button
                  onClick={() => onToggleUnresponded(false)}
                  className="ml-1 hover:text-destructive"
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
            >
              Limpiar todo
            </Button>
          </div>
        )}
      </div>

      {/* Contador de resultados */}
      <div className="pt-2 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Mostrando <span className="font-semibold text-foreground">{shownCount}</span> de{" "}
          <span className="font-semibold text-foreground">{totalCount}</span> reseñas
        </p>
      </div>
    </div>
  );
}
