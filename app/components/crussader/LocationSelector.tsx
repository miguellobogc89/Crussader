// app/components/crussader/LocationSelector.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { MapPin, ChevronDown, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { useBootstrapData } from "@/app/providers/bootstrap-store";

export type LocationLite = {
  id: string;
  title: string;
  city?: string | null;
  reviewsCount?: number | null;
};

export default function LocationSelector({
  onSelect,
}: {
  onSelect: (id: string | null, location?: LocationLite | null) => void;
}) {
  const boot = useBootstrapData();
  const [locations, setLocations] = useState<LocationLite[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!boot) return;
    const rows = Array.isArray(boot.locations)
      ? boot.locations.map((l: any) => ({
          id: String(l.id),
          title: String(l.title ?? "Sin nombre"),
          city: l.city ?? null,
          reviewsCount: l.reviewsCount ?? 0,
        }))
      : [];

    setLocations(rows);

    const saved = typeof window !== "undefined" ? localStorage.getItem("reviews:locationId") : null;
    const valid = rows.some((r) => r.id === saved);
    const defaultId = valid ? saved : null;
    setSelectedLocationId(defaultId);
    const loc = rows.find((x) => x.id === defaultId) ?? null;
    onSelect(defaultId, loc);
    setLoading(false);
  }, [boot]);

  const selected = useMemo(
    () => locations.find((l) => l.id === selectedLocationId) ?? null,
    [locations, selectedLocationId]
  );

  const handleSelect = (id: string | null) => {
    const loc = id ? locations.find((x) => x.id === id) ?? null : null;
    setSelectedLocationId(id);
    if (typeof window !== "undefined") localStorage.setItem("reviews:locationId", id ?? "");
    onSelect(id, loc);
  };

  if (loading) {
    return (
      <div className="w-full flex justify-center items-center h-9 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        Cargando ubicaciones...
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 h-9 w-full">
      <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="group inline-flex items-center justify-between gap-2 rounded-md bg-transparent
                       px-2 py-1.5 text-sm font-medium text-foreground transition-all w-full
                       border"
          >
            <span className="truncate text-left flex-1">
              {selectedLocationId === null
                ? "Todas las ubicaciones"
                : selected
                ? `${selected.title}${selected.city ? " — " + selected.city : ""}`
                : "Selecciona ubicación"}
            </span>
            <ChevronDown className="h-4 w-4 text-foreground/50 group-hover:text-foreground/70 transition-colors shrink-0" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-[280px] max-w-full">
          <DropdownMenuItem
            onClick={() => handleSelect(null)}
            className={`font-medium text-foreground ${
              selectedLocationId === null ? "bg-primary/10 text-primary" : ""
            }`}
          >
            Todas las ubicaciones
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {locations.map((l) => {
            const isActive = l.id === selectedLocationId;
            return (
              <DropdownMenuItem
                key={l.id}
                onClick={() => handleSelect(l.id)}
                className={`flex flex-col items-start ${
                  isActive ? "bg-primary/10 text-primary" : ""
                }`}
              >
                <span className="truncate w-full">{l.title}</span>
                {l.city && (
                  <span className="text-xs text-muted-foreground truncate w-full">
                    {l.city}
                  </span>
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
