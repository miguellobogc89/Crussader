"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from "@/app/components/ui/dropdown-menu";
import { RefreshCw, ChevronDown, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ServiceRow = {
  id: string;
  locationId: string;
  name: string;
  description?: string | null;
  durationMin: number;
  priceCents?: number | null;     // opción A (entero en céntimos)
  price?: number | string | null; // opción B (decimal)
  color?: string | null;
  active: boolean;
};

const SWATCHES = [
  "#EF4444","#F59E0B","#F97316","#84CC16","#10B981","#06B6D4",
  "#3B82F6","#8B5CF6","#A855F7","#EC4899","#64748B","#111827",
];

export default function ServicesTable({
  locationId,
  disabled = false,
  className,
  onRefreshed,
}: {
  locationId?: string;
  disabled?: boolean;
  className?: string;
  onRefreshed?: (rows: ServiceRow[]) => void;
}) {
  const [rows, setRows] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edición por fila
  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState<Partial<ServiceRow>>({});

  const topNameRef = useRef<HTMLInputElement | null>(null);

  const usesCents = useMemo(
    () => rows.some(r => typeof r.priceCents === "number"),
    [rows]
  );

  function euroToCents(val: string): number {
    const n = Number(String(val).replace(",", "."));
    if (!Number.isFinite(n)) return 0;
    return Math.round(n * 100);
  }
  function centsToEuroStr(cents?: number | null): string {
    const n = (cents ?? 0) / 100;
    return Number(n).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  async function fetchServices() {
    if (!locationId) { setRows([]); return; }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/calendar/services?locationId=${encodeURIComponent(locationId)}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || json?.ok === false) throw new Error(json?.error || `HTTP ${res.status}`);

      const items: ServiceRow[] = Array.isArray(json?.items)
        ? json.items.map((s: any) => ({
            id: String(s.id),
            locationId: String(locationId),
            name: String(s.name ?? ""),
            description: s.description ?? null,
            durationMin: Number(s.durationMin ?? 0),
            priceCents: typeof s.priceCents === "number" ? s.priceCents : undefined,
            price: typeof s.price !== "undefined" ? Number(s.price) : undefined,
            color: s.color ?? null,
            active: Boolean(s.active),
          }))
        : [];

      setRows(items);
      onRefreshed?.(items);
    } catch (e: any) {
      setRows([]);
      setErrorMsg(e?.message || "Error al cargar servicios");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchServices(); /* eslint-disable-next-line */ }, [locationId]);

  async function createService() {
    if (!locationId) return;
    setCreating(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/calendar/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId,
          name: "Nuevo servicio",
          description: "",
          durationMin: 30,
          color: null,
          // priceCents: 0, // si usas céntimos
          // price: 0,      // si usas decimal
          active: true,
        }),
      });
      const json = await res.json();
      if (!res.ok || json?.ok === false) throw new Error(json?.error || `HTTP ${res.status}`);

      const created: ServiceRow = {
        id: String(json.item.id),
        locationId,
        name: String(json.item.name ?? "Nuevo servicio"),
        description: json.item.description ?? "",
        durationMin: Number(json.item.durationMin ?? 30),
        priceCents: typeof json.item.priceCents === "number" ? json.item.priceCents : undefined,
        price: typeof json.item.price !== "undefined" ? Number(json.item.price) : undefined,
        color: json.item.color ?? null,
        active: Boolean(json.item.active),
      };

      setRows(prev => [created, ...prev]);
      setEditingId(created.id);
      setEdit({
        name: created.name,
        description: created.description ?? "",
        durationMin: created.durationMin,
        priceCents: created.priceCents,
        price: created.price,
        color: created.color,
      });
      setTimeout(() => topNameRef.current?.focus(), 0);
    } catch (e: any) {
      setErrorMsg(e?.message || "No se pudo crear el servicio");
    } finally {
      setCreating(false);
    }
  }

  function isDirty(row: ServiceRow) {
    return (
      (edit.name ?? row.name) !== row.name ||
      (String(edit.description ?? row.description ?? "") !== String(row.description ?? "")) ||
      Number(edit.durationMin ?? row.durationMin) !== row.durationMin ||
      (usesCents
        ? Number(edit.priceCents ?? row.priceCents ?? 0) !== Number(row.priceCents ?? 0)
        : Number(edit.price ?? row.price ?? 0) !== Number(row.price ?? 0)) ||
      (edit.color ?? row.color) !== row.color
    );
  }

  async function saveRow(row: ServiceRow) {
    const id = row.id;
    setSavingId(id);
    setErrorMsg(null);
    try {
      const patch: any = {
        id,
        name: String(edit.name ?? row.name),
        description: String(edit.description ?? row.description ?? ""),
        durationMin: Number(edit.durationMin ?? row.durationMin),
        color: edit.color ?? row.color ?? null,
      };
      if (usesCents) patch.priceCents = Number(edit.priceCents ?? row.priceCents ?? 0);
      else patch.price = Number(edit.price ?? row.price ?? 0);

      const res = await fetch("/api/calendar/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const json = await res.json();
      if (!res.ok || json?.ok === false) throw new Error(json?.error || `HTTP ${res.status}`);

      const u = json.item;
      const updated: ServiceRow = {
        id: String(u.id),
        locationId: row.locationId,
        name: String(u.name ?? ""),
        description: u.description ?? null,
        durationMin: Number(u.durationMin ?? 0),
        priceCents: typeof u.priceCents === "number" ? u.priceCents : undefined,
        price: typeof u.price !== "undefined" ? Number(u.price) : undefined,
        color: u.color ?? null,
        active: Boolean(u.active),
      };
      setRows(prev => prev.map(r => (r.id === id ? updated : r)));
      setEditingId(null);
      setEdit({});
    } catch (e: any) {
      setErrorMsg(e?.message || "No se pudo guardar");
    } finally {
      setSavingId(null);
    }
  }

  const ActionBar = (
    <div className="flex items-center justify-end gap-2">
      <Button
        size="sm"
        className="rounded-full bg-gradient-to-r from-fuchsia-500 via-purple-500 to-sky-500 text-white hover:opacity-90"
        onClick={createService}
        disabled={disabled || creating || loading || !locationId}
      >
        Añadir servicio
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={fetchServices}
        disabled={disabled || loading}
        title="Refrescar"
      >
        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
      </Button>
    </div>
  );

  return (
    <Card className={className}>
      <CardContent className="p-0">
        {/* Header sin contador; acciones a la derecha */}
        <div className="flex items-center justify-between px-4 py-3">
          <div />
          {ActionBar}
        </div>

        {errorMsg && <div className="px-4 pb-2 text-sm text-red-600">{errorMsg}</div>}

        <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                {/* Anchuras fijas para columnas pequeñas y darle aire a "Descripción" */}
                <th className="px-4 py-2 text-left font-medium w-[18%]">Nombre</th>
                <th className="px-4 py-2 text-left font-medium w-[42%]">Descripción</th>
                <th className="px-4 py-2 text-left font-medium w-[12%]">Duración</th>
                <th className="px-4 py-2 text-left font-medium w-[12%]">Precio</th>
                <th className="px-4 py-2 text-left font-medium w-[12%]">Color</th>
                <th className="px-2 py-2 text-right font-medium w-[4%]"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-4 py-4" colSpan={6}>Cargando…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td className="px-4 py-6 text-muted-foreground" colSpan={6}>No hay servicios en esta ubicación.</td></tr>
              ) : (
                rows.map((s) => {
                  const isEditing = editingId === s.id;
                  const dirty = isEditing && isDirty(s);

                  return (
                    <tr key={s.id} className={cn("border-t", savingId === s.id && "opacity-60")}>
                      {/* Nombre */}
                      <td className="px-4 py-2 align-middle">
                        {isEditing ? (
                          <Input
                            ref={topNameRef}
                            value={String(edit.name ?? "")}
                            onChange={(e) => setEdit(prev => ({ ...prev, name: e.target.value }))}
                            className="h-8 w-64"
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveRow(s); } }}
                          />
                        ) : (
                          <button
                            className="text-left hover:underline"
                            onClick={() => { setEditingId(s.id); setEdit({ ...s }); }}
                          >
                            {s.name}
                          </button>
                        )}
                      </td>

                      {/* Descripción (más ancha + centrada verticalmente + misma altura en edición) */}
                      <td className="px-4 py-2 align-middle">
                        {isEditing ? (
                          <Input
                            value={String(edit.description ?? "")}
                            onChange={(e) => setEdit(prev => ({ ...prev, description: e.target.value }))}
                            className="h-8 w-full"
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveRow(s); } }}
                          />
                        ) : (
                          <p className="truncate whitespace-nowrap">{s.description?.trim() ? s.description : "—"}</p>
                        )}
                      </td>

                      {/* Duración */}
                      <td className="px-4 py-2 align-middle">
                        {isEditing ? (
                          <Input
                            type="number"
                            min={5}
                            step={5}
                            value={Number(edit.durationMin ?? s.durationMin)}
                            onChange={(e) => setEdit(prev => ({ ...prev, durationMin: Number(e.target.value || 0) }))}
                            className="h-8 w-24"
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveRow(s); } }}
                          />
                        ) : (
                          <span>{s.durationMin} min</span>
                        )}
                      </td>

                      {/* Precio */}
                      <td className="px-4 py-2 align-middle">
                        {isEditing ? (
                          <Input
                            inputMode="decimal"
                            value={
                              usesCents
                                ? centsToEuroStr(Number(edit.priceCents ?? s.priceCents ?? 0))
                                : String(edit.price ?? s.price ?? 0)
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              setEdit(prev => usesCents
                                ? ({ ...prev, priceCents: euroToCents(val) })
                                : ({ ...prev, price: val }));
                            }}
                            className="h-8 w-28"
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveRow(s); } }}
                          />
                        ) : (
                          <span>
                            {usesCents
                              ? (Number(s.priceCents ?? 0) / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" })
                              : Number(s.price ?? 0).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                          </span>
                        )}
                      </td>

                      {/* Color */}
                      <td className="px-4 py-2 align-middle">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2 h-8">
                              <span
                                className="inline-block h-3 w-3 rounded-full border"
                                style={{
                                  backgroundColor: s.color || "transparent",
                                  borderColor: s.color ? "transparent" : "var(--muted-foreground)",
                                }}
                              />
                              {s.color ?? "—"}
                              <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="p-2 w-56">
                            <div className="grid grid-cols-6 gap-2 px-1 pb-2">
                              {SWATCHES.map((hex) => (
                                <button
                                  key={hex}
                                  type="button"
                                  className="h-6 w-6 rounded-full border"
                                  style={{ backgroundColor: hex, borderColor: "transparent" }}
                                  onClick={() => setEdit(prev => ({ ...prev, color: hex }))}
                                  title={hex}
                                />
                              ))}
                            </div>
                            <button
                              className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-md"
                              onClick={() => setEdit(prev => ({ ...prev, color: null }))}
                            >
                              Quitar color
                            </button>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>

                      {/* Guardar (solo icono), derecha del todo */}
                      <td className="px-2 py-2 align-middle text-right">
                        {isEditing ? (
                          <Button
                            size="icon"
                            className="h-8 w-8"
                            disabled={savingId === s.id || !dirty}
                            onClick={() => saveRow(s)}
                            title="Guardar"
                          >
                            {savingId === s.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className={cn("h-4 w-4", !dirty && "opacity-40")} />
                            )}
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
