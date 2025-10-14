"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin, ChevronDown, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

export type LocationLite = {
  id: string;
  title: string;
  city?: string | null;
  reviewsCount?: number | null;
  color?: string | null;
};

export default function LocationSelector({
  companyId,
  onSelect,
  className = "",
}: {
  companyId: string | null | undefined;
  onSelect: (id: string | null, location?: LocationLite | null) => void;
  className?: string;
}) {
  const [locations, setLocations] = useState<LocationLite[] | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();

    const HARD_TIMEOUT_MS = 6000;
    const hardTimeout = setTimeout(() => {
      if (!cancelled && locations === null) {
        console.warn("[LocationSelector] timeout duro");
        setError("timeout");
        setLocations([]);         // salir de loading
        // ❌ no reseteamos selección ni onSelect(null)
      }
    }, HARD_TIMEOUT_MS);

    async function load() {
      try {
        setError(null);

        if (!companyId) {
          setLocations([]);
          // mantenemos la selección previa por si el usuario vuelve atrás
          return;
        }

        setLocations(null); // loading
        const res = await fetch(`/api/locations?companyId=${companyId}`, {
          cache: "no-store",
          signal: ac.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const raw = await res.text();
        let json: any = {};
        try {
          json = raw ? JSON.parse(raw) : {};
        } catch {
          throw new Error("invalid_json");
        }
        if (cancelled) return;

        const rows: LocationLite[] = (json?.locations || []).map((l: any) => ({
          id: String(l.id),
          title: String(l.title ?? "Sin nombre"),
          city: l.city ?? null,
          reviewsCount: typeof l.reviewsCount === "number" ? l.reviewsCount : 0,
          color: l.color ?? null,
        }));

        setLocations(rows);

        const saved = typeof window !== "undefined" ? localStorage.getItem("reviews:locationId") : null;
        const prefer = (id: string | null) => (id && rows.some((r) => r.id === id) ? id : null);
        const defaultId = prefer(saved) ?? rows[0]?.id ?? null;

        if (defaultId) {
          setSelectedLocationId(defaultId);
          localStorage.setItem("reviews:locationId", defaultId);
        }
        const loc = rows.find((x) => x.id === defaultId) ?? null;
        onSelect(defaultId, loc);
      } catch (e) {
        if (cancelled) return;
        console.error("[LocationSelector] fallo fetch ubicaciones:", e);
        setError("fetch");
        setLocations([]);         // salir de loading
        // ❌ NO borrar selectedLocationId ni onSelect(null)
      } finally {
        clearTimeout(hardTimeout);
      }
    }

    load();

    return () => {
      cancelled = true;
      clearTimeout(hardTimeout);
      ac.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const selected =
    useMemo(
      () => (locations ?? []).find((l) => l.id === selectedLocationId) ?? (locations?.[0] ?? null),
      [locations, selectedLocationId]
    ) || null;

  const isLoading = locations === null;
  const hasMoreThanOne = (locations?.length ?? 0) > 1;

  const dotStyle =
    (selected?.color ?? "").toString() ||
    "linear-gradient(135deg, #60A5FA 0%, #F472B6 100%)";

  const triggerClasses = `
    group inline-flex items-center gap-3
    rounded-xl border border-border/80 bg-background
    px-3.5 py-2 text-sm font-medium
    shadow-sm transition-all
    hover:shadow-md hover:border-foreground/30
    focus:outline-none focus-visible:ring-2 focus-visible:ring-ring
  `;

  // Loading
  if (isLoading) {
    return (
      <button type="button" className={`${triggerClasses} ${className}`} aria-disabled disabled>
        <span
          aria-hidden
          className="h-3.5 w-3.5 rounded-full ring-1 ring-black/5 bg-gradient-to-br from-muted to-muted-foreground/30"
        />
        <span className="inline-flex items-center gap-2 text-foreground/90">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando ubicaciones…
        </span>
      </button>
    );
  }

  // Sin ubicaciones / Error
  if (!locations || locations.length === 0) {
    return (
      <button type="button" className={`${triggerClasses} ${className}`} aria-disabled disabled>
        <span className="h-3.5 w-3.5 rounded-full ring-1 ring-black/5 bg-muted" />
        <span className="text-foreground/90">
          {error ? "Error cargando ubicaciones" : "Sin ubicaciones"}
        </span>
        <ChevronDown className="h-4 w-4 text-foreground/30" />
      </button>
    );
  }

  // Una ubicación
  if (!hasMoreThanOne) {
    return (
      <button type="button" className={`${triggerClasses} ${className}`} aria-disabled disabled>
        <span
          aria-hidden
          className="h-3.5 w-3.5 rounded-full ring-1 ring-black/5"
          style={{
            background: dotStyle.startsWith("#") ? undefined : (dotStyle as string),
            backgroundColor: dotStyle.startsWith("#") ? dotStyle : undefined,
          }}
        />
        <span className="text-foreground/90">
          {selected ? selected.title : "Selecciona ubicación"}
          {selected?.city ? <span className="text-foreground/60"> · {selected.city}</span> : null}
        </span>
        <ChevronDown className="h-4 w-4 text-foreground/30" />
      </button>
    );
  }

  // Varias ubicaciones
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={`${triggerClasses} ${className}`}>
          <span
            aria-hidden
            className="h-3.5 w-3.5 rounded-full ring-1 ring-black/5"
            style={{
              background: dotStyle.startsWith("#") ? undefined : (dotStyle as string),
              backgroundColor: dotStyle.startsWith("#") ? dotStyle : undefined,
            }}
          />
          <span className="text-foreground/90">
            {selected ? selected.title : "Selecciona ubicación"}
            {selected?.city ? <span className="text-foreground/60"> · {selected.city}</span> : null}
          </span>
          <ChevronDown className="h-4 w-4 text-foreground/50 group-hover:text-foreground/70 transition-colors" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-80">
        <DropdownMenuLabel className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Tus ubicaciones
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {locations.map((l) => {
          const isActive = l.id === selectedLocationId;
          const bg = l.color ?? undefined;
          const isHex = typeof bg === "string" && bg.startsWith("#");

          return (
            <DropdownMenuItem
              key={l.id}
              className={`flex items-center gap-3 ${isActive ? "bg-violet-50 text-violet-900" : ""}`}
              onClick={() => {
                setSelectedLocationId(l.id);
                if (typeof window !== "undefined") localStorage.setItem("reviews:locationId", l.id);
                onSelect(l.id, l);
              }}
            >
              <span
                aria-hidden
                className="h-3 w-3 rounded-full ring-1 ring-black/5 shrink-0"
                style={{
                  background: bg && !isHex ? (bg as string) : undefined,
                  backgroundColor: bg && isHex ? (bg as string) : undefined,
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="truncate">{l.title}</div>
                {l.city ? <div className="truncate text-xs text-muted-foreground">{l.city}</div> : null}
              </div>
              <span className="ml-2 tabular-nums text-xs text-muted-foreground shrink-0">
                ({l.reviewsCount ?? 0})
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
