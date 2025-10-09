// app/components/reviews/ReviewsToolbar.tsx
"use client";

import { useCallback, useMemo, useState } from "react";
import { ArrowUpDown, Check } from "lucide-react";
import ReviewsFilters, { type ReviewsFiltersValue } from "@/app/components/reviews/controls/ReviewsFilters";

/** Comparación simple sin dependencias externas */
function shallowArrayEqual(a: number[], b: number[]) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
function filtersEqual(a: ReviewsFiltersValue, b: ReviewsFiltersValue) {
  return (
    a.unanswered === b.unanswered &&
    a.withPhotos === b.withPhotos &&
    shallowArrayEqual(a.stars, b.stars)
  );
}

export type ReviewsToolbarProps = {
  className?: string;
  onFiltersChange?: (value: ReviewsFiltersValue) => void;
  onSearchChange?: (q: string) => void;
  onOrderChange?: (order: "recent" | "oldest" | "highest" | "lowest") => void;
};

export default function ReviewsToolbar({
  className,
  onFiltersChange,
  onSearchChange,
  onOrderChange,
}: ReviewsToolbarProps) {
  const [filters, setFilters] = useState<ReviewsFiltersValue>({
    stars: [],
    unanswered: false,
    withPhotos: false,
  });

  const [search, setSearch] = useState("");
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderBy, setOrderBy] =
    useState<"recent" | "oldest" | "highest" | "lowest">("recent");

  /** Callback estable que evita setState redundante (corta el bucle) */
  const handleFiltersChange = useCallback(
    (v: ReviewsFiltersValue) => {
      setFilters((prev) => {
        if (filtersEqual(prev, v)) return prev; // no cambies estado si es igual
        return v;
      });
      onFiltersChange?.(v);
    },
    [onFiltersChange]
  );

  const handleOrder = useCallback(
    (val: "recent" | "oldest" | "highest" | "lowest") => {
      setOrderBy(val);
      setOrderOpen(false);
      onOrderChange?.(val);
    },
    [onOrderChange]
  );

  return (
    <div className={className}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* (izquierda) filtros */}
        <ReviewsFilters
          /** Si tu componente soporta 'value', mejor usar 'value' en vez de 'defaultValue' */
          defaultValue={filters}
          onChange={handleFiltersChange}
        />

        {/* (derecha) búsqueda + ordenar */}
        <div className="relative flex items-center gap-2">
          <input
            type="text"
            placeholder="Buscar por texto, autor…"
            value={search}
            onChange={(e) => {
              const q = e.target.value;
              setSearch(q);
              onSearchChange?.(q);
            }}
            className="w-64 rounded-md border bg-white px-3 py-2 text-sm outline-none"
          />

          <button
            type="button"
            onClick={() => setOrderOpen((v) => !v)}
            className="flex items-center gap-1 rounded-md border px-2 py-2 text-sm bg-white"
          >
            <ArrowUpDown size={16} />
            <span>Ordenar</span>
          </button>

          {orderOpen && (
            <div className="absolute right-0 top-full z-10 mt-2 w-48 rounded-md border bg-white shadow-lg">
              <ul className="py-1 text-sm">
                <li>
                  <button
                    onClick={() => handleOrder("recent")}
                    className="flex w-full items-center gap-2 px-3 py-2 hover:bg-muted/30"
                  >
                    {orderBy === "recent" ? <Check size={14} /> : <span className="w-4" />}
                    Más recientes
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleOrder("oldest")}
                    className="flex w-full items-center gap-2 px-3 py-2 hover:bg-muted/30"
                  >
                    {orderBy === "oldest" ? <Check size={14} /> : <span className="w-4" />}
                    Más antiguos
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleOrder("highest")}
                    className="flex w-full items-center gap-2 px-3 py-2 hover:bg-muted/30"
                  >
                    {orderBy === "highest" ? <Check size={14} /> : <span className="w-4" />}
                    Más valoraciones
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleOrder("lowest")}
                    className="flex w-full items-center gap-2 px-3 py-2 hover:bg-muted/30"
                  >
                    {orderBy === "lowest" ? <Check size={14} /> : <span className="w-4" />}
                    Menos valoraciones
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
