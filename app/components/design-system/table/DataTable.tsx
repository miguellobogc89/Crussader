"use client";

import * as React from "react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import HeaderCell from "./HeaderCell";
import SearchBar from "./SearchBar";
import type { ColumnDef, SortDir } from "./types";

/**
 * Tabla genérica con:
 * - Cabeceras (orden/filtros por columna).
 * - Buscador global (componente SearchBar) arriba a la derecha.
 * - Primera columna izquierda; resto centradas (configurable en columnas).
 */
export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  className,
  withActions = true,
  showGlobalSearch = true,
  searchPlaceholder = "Buscar…",
  getRowSearchText,
}: {
  columns: ColumnDef<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  className?: string;
  withActions?: boolean;
  showGlobalSearch?: boolean;
  searchPlaceholder?: string;
  getRowSearchText?: (row: T) => string;
}) {
  // estado de orden
  const [sortBy, setSortBy] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<SortDir>("asc");

  // filtros por columna
  const [textFilters, setTextFilters] = React.useState<Record<string, string>>({});
  const [boolFilters, setBoolFilters] = React.useState<Record<string, boolean | null>>({});

  // filtro global (buscador)
  const [qGlobal, setQGlobal] = React.useState("");

  function toggleSort(colId: string) {
    if (sortBy !== colId) {
      setSortBy(colId);
      setSortDir("asc");
    } else {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    }
  }

  const processed = React.useMemo(() => {
    let out = [...rows];

    // ----- Filtro global (buscador) -----
    const needle = qGlobal.trim().toLowerCase();
    if (needle) {
      out = out.filter((r) => {
        const base =
          getRowSearchText?.(r) ??
          columns
            .map((c) => {
              try {
                const v = c.accessor(r) as unknown;
                if (v == null) return "";
                if (typeof v === "number") return String(v);
                if (typeof v === "boolean") return v ? "true" : "false";
                return String(v);
              } catch {
                return "";
              }
            })
            .join(" ");
        return base.toLowerCase().includes(needle);
      });
    }

    // ----- Filtros por columna -----
    // texto
    for (const col of columns) {
      const q = textFilters[col.id];
      if (col.filter === "text" && q && q.trim()) {
        const n = q.trim().toLowerCase();
        out = out.filter((r) => String(col.accessor(r) ?? "").toLowerCase().includes(n));
      }
    }
    // boolean
    for (const col of columns) {
      const f = boolFilters[col.id];
      if (col.filter === "boolean" && f !== null && typeof f !== "undefined") {
        out = out.filter((r) => Boolean(col.accessor(r)) === f);
      }
    }

    // ----- Orden -----
    if (sortBy) {
      const col = columns.find((c) => c.id === sortBy);
      if (col) {
        out.sort((a, b) => {
          const A = col.accessor(a) as unknown;
          const B = col.accessor(b) as unknown;
          let cmp = 0;
          if (typeof A === "number" && typeof B === "number") cmp = A - B;
          else cmp = String(A ?? "").localeCompare(String(B ?? ""), "es");
          return sortDir === "asc" ? cmp : -cmp;
        });
      }
    }

    return out;
  }, [rows, columns, sortBy, sortDir, textFilters, boolFilters, qGlobal, getRowSearchText]);

  // colgroup con % si se pasan; si no, auto
  const widthPerc = columns.map((c) => c.widthPerc).filter((n) => typeof n === "number") as number[];
  const usePerc = widthPerc.length === columns.length && Math.abs(widthPerc.reduce((a, b) => a + b, 0) - 100) < 5;

  return (
    <Card className={className}>
      <CardContent className="p-0">
        {/* Toolbar superior: buscador global a la derecha */}
        {showGlobalSearch && (
          <div className="flex items-center justify-end px-4 py-3">
            <SearchBar
              value={qGlobal}
              onChange={setQGlobal}
              placeholder={searchPlaceholder}
            />
          </div>
        )}

        <table className="w-full text-sm border-t" style={{ tableLayout: "fixed" }}>
          {usePerc && (
            <colgroup>
              {columns.map((c) => (
                <col key={c.id} style={{ width: `${c.widthPerc}%` }} />
              ))}
              {withActions && <col style={{ width: "4%" }} />}
            </colgroup>
          )}

          <thead>
            <tr>
              {columns.map((c, idx) => (
                <HeaderCell
                  key={c.id}
                  label={c.label}
                  align={c.align ?? (idx === 0 ? "left" : "center")}
                  sortable={!!c.sortable}
                  filter={c.filter ?? "none"}
                  sortedActive={sortBy === c.id}
                  sortDir={sortDir}
                  onToggleSort={c.sortable ? () => toggleSort(c.id) : undefined}
                  textFilterValue={c.filter === "text" ? (textFilters[c.id] ?? "") : undefined}
                  setTextFilterValue={
                    c.filter === "text"
                      ? (v) => setTextFilters((prev) => ({ ...prev, [c.id]: v }))
                      : undefined
                  }
                  booleanFilterValue={
                    c.filter === "boolean" ? (boolFilters[c.id] ?? null) : undefined
                  }
                  setBooleanFilterValue={
                    c.filter === "boolean"
                      ? (v) => setBoolFilters((prev) => ({ ...prev, [c.id]: v }))
                      : undefined
                  }
                />
              ))}
              {withActions && (
                <th className="px-2 py-2 font-semibold text-center bg-muted/60 w-[4%]" />
              )}
            </tr>
          </thead>

          <tbody>
            {processed.length === 0 ? (
              <tr>
                <td
                  className="px-3 py-6 text-muted-foreground text-center"
                  colSpan={columns.length + (withActions ? 1 : 0)}
                >
                  Sin resultados
                </td>
              </tr>
            ) : (
              processed.map((row) => {
                const key = rowKey(row);
                return (
                  <tr key={key} className="border-t">
                    {columns.map((c, idx) => {
                      const align = c.align ?? (idx === 0 ? "left" : "center");
                      return (
                        <td
                          key={c.id}
                          className={cn(
                            "px-3 py-2 align-middle truncate",
                            align === "left"
                              ? "text-left"
                              : align === "right"
                              ? "text-right"
                              : "text-center"
                          )}
                          title={
                            typeof c.accessor(row) === "string"
                              ? (c.accessor(row) as string)
                              : undefined
                          }
                        >
                          {c.render ? c.render(row) : String(c.accessor(row) ?? "—")}
                        </td>
                      );
                    })}
                    {withActions && (
                      <td className="px-2 py-2 align-middle text-center">
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Acciones">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
