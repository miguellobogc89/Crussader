// app/components/crussader/LocationSelector.tsx
"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { MapPin, ChevronDown, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { useBootstrapData } from "@/app/providers/bootstrap-store";

export type LocationLite = {
  id: string;
  title: string;
  city?: string | null;
  reviewsCount?: number | null;
  openingHours?: any | null;
};

export default function LocationSelector({
  onSelect,
}: {
  onSelect: (id: string | null, location?: LocationLite | null) => void;
}) {
  const boot = useBootstrapData();
  const [locations, setLocations] = useState<LocationLite[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const onSelectRef = useRef(onSelect);

useEffect(() => {
  onSelectRef.current = onSelect;
}, [onSelect]);


useEffect(() => {
  if (!boot) return;

const rows = Array.isArray(boot.locations)
  ? boot.locations.map((l: any) => ({
      id: String(l.id),
      title: String(l.title ?? "Sin nombre"),
      city: l.city ?? null,
      reviewsCount: l.reviewsCount ?? 0,

      // ✅ NUEVO (la clave del tema)
      openingHours: l.openingHours ?? null,
    }))
  : [];


  setLocations(rows);

  let defaultId: string | null = null;

  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("reviews:locationId");
    const validSaved = rows.some((r) => r.id === saved);
    if (validSaved && saved) {
      defaultId = saved;
    }
  }

  if (!defaultId && rows.length > 0) {
    defaultId = rows[0].id;
  }

  setSelectedLocationId(defaultId);

  const loc = defaultId ? rows.find((x) => x.id === defaultId) ?? null : null;

  if (defaultId) {
    onSelectRef.current(defaultId, loc);
    if (typeof window !== "undefined") {
      localStorage.setItem("reviews:locationId", defaultId);
    }
  }

  setLoading(false);
}, [boot]);


  const selected = useMemo(
    () => locations.find((l) => l.id === selectedLocationId) ?? null,
    [locations, selectedLocationId]
  );

  const otherLocations = useMemo(() => {
    if (!selectedLocationId) return locations;
    return locations.filter((l) => l.id !== selectedLocationId);
  }, [locations, selectedLocationId]);

  const hasMoreOptions = otherLocations.length > 0;

  const label = selected
    ? `${selected.title}${selected.city ? " — " + selected.city : ""}`
    : "Selecciona ubicación";

  const handleSelect = (id: string) => {
    const loc = locations.find((x) => x.id === id) ?? null;
    setSelectedLocationId(id);
    if (typeof window !== "undefined") {
      localStorage.setItem("reviews:locationId", id);
    }
    onSelect(id, loc);
  };

  if (loading) {
    return (
      <div className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-card/40 text-xs sm:text-sm xl2:text-base text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        Cargando ubicaciones…
      </div>
    );
  }

  const TriggerButton = (
    <button
      type="button"
      className="
        group inline-flex items-center gap-2
        rounded-lg bg-card/80
        px-3 py-2 font-medium text-foreground
        hover:bg-card transition-colors
        max-w-full
        text-xs sm:text-sm xl2:text-base
      "
      disabled={!hasMoreOptions}
      aria-disabled={!hasMoreOptions}
    >
      <span className="inline-flex items-center gap-2 truncate text-left">
        <MapPin className="w-4 h-4 text-primary/70 shrink-0" />
        <span className="truncate">{label}</span>
      </span>

      <ChevronDown
        className={[
          "h-4 w-4 shrink-0 transition-colors",
          hasMoreOptions
            ? "text-foreground/50 group-hover:text-foreground/70"
            : "text-muted-foreground/40",
        ].join(" ")}
      />
    </button>
  );

  if (!hasMoreOptions) {
    return TriggerButton;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{TriggerButton}</DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="w-[280px] max-w-[90vw] rounded-lg"
      >
        {otherLocations.map((l) => {
          return (
            <DropdownMenuItem
              key={l.id}
              onClick={() => handleSelect(l.id)}
              className="flex flex-col items-start rounded-md"
            >
              <span className="truncate w-full text-sm xl2:text-base">
                {l.title}
              </span>
              {l.city ? (
                <span className="text-xs xl2:text-sm text-muted-foreground truncate w-full">
                  {l.city}
                </span>
              ) : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
