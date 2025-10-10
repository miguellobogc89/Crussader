// app/components/crussader/LocationSelector.tsx
"use client";

import { useMemo } from "react";
import { MapPin, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

type LocationLite = {
  id: string;
  title: string;
  city?: string | null;
  reviewsCount?: number | null;
  color?: string | null;
};

export default function LocationSelector({
  locations,
  selectedLocationId,
  onSelect,
  loading = false,
  className = "",
}: {
  locations: LocationLite[];
  selectedLocationId?: string;
  onSelect: (id: string) => void;
  loading?: boolean;
  className?: string;
}) {
  const selected =
    useMemo(
      () => locations.find((l) => l.id === selectedLocationId) ?? locations[0],
      [locations, selectedLocationId]
    ) || null;

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

  // === Estado: CARGANDO ===
  if (loading) {
    return (
      <button type="button" className={`${triggerClasses} ${className}`} disabled>
        <span
          aria-hidden
          className="h-3.5 w-3.5 rounded-full ring-1 ring-black/5"
          style={{
            background: dotStyle.startsWith("#") ? undefined : (dotStyle as string),
            backgroundColor: dotStyle.startsWith("#") ? dotStyle : undefined,
          }}
        />
        <span className="text-foreground/90">Cargando ubicaciones…</span>
        <ChevronDown className="h-4 w-4 text-foreground/40" />
      </button>
    );
  }

  // === Sin ubicaciones (ya cargado) ===
  if (!locations || locations.length === 0) {
    return (
      <div className={`flex items-center flex-wrap gap-3 ${className}`}>
        <button type="button" className={triggerClasses} disabled>
          <span
            aria-hidden
            className="h-3.5 w-3.5 rounded-full ring-1 ring-black/5"
            style={{
              background: dotStyle.startsWith("#") ? undefined : (dotStyle as string),
              backgroundColor: dotStyle.startsWith("#") ? dotStyle : undefined,
            }}
          />
          <span className="text-foreground/90">Sin ubicaciones</span>
          <ChevronDown className="h-4 w-4 text-foreground/40" />
        </button>

        <div className="rounded-md border bg-popover text-popover-foreground shadow-sm px-3 py-2">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4" />
            <span className="font-medium">Esta empresa no tiene ubicaciones</span>
          </div>
        </div>
      </div>
    );
  }

  const hasMoreThanOne = locations.length > 1;

  // === Sólo una ubicación
  if (!hasMoreThanOne) {
    return (
      <div className={`flex items-center flex-wrap gap-3 ${className}`}>
        <button type="button" className={triggerClasses} disabled>
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
          <ChevronDown className="h-4 w-4 text-foreground/40" />
        </button>

        <div className="rounded-md border bg-popover text-popover-foreground shadow-sm px-3 py-2">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4" />
            <span className="font-medium">No tienes más ubicaciones</span>
          </div>
        </div>
      </div>
    );
  }

  // === Varias ubicaciones → desplegable
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
          const isActive = l.id === selected?.id;
          const bg = l.color ?? undefined;
          const isHex = typeof bg === "string" && bg.startsWith("#");

          return (
            <DropdownMenuItem
              key={l.id}
              className={`flex items-center gap-3 ${isActive ? "bg-violet-50 text-violet-900" : ""}`}
              onClick={() => onSelect(l.id)}
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
