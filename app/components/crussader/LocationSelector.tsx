"use client";

import { useEffect, useState, useMemo } from "react";
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

    let defaultId: string | null = null;

    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("reviews:locationId");
      const validSaved = rows.some((r) => r.id === saved);
      if (validSaved && saved) {
        defaultId = saved;
      }
    }

    if (!defaultId && rows.length > 0) {
      defaultId = rows[0].id; // por defecto la primera ubicación
    }

    setSelectedLocationId(defaultId);

    const loc =
      (defaultId ? rows.find((x) => x.id === defaultId) : null) ?? null;

    if (defaultId) {
      onSelect(defaultId, loc);
      if (typeof window !== "undefined") {
        localStorage.setItem("reviews:locationId", defaultId);
      }
    }

    setLoading(false);
  }, [boot]); // solo depende de boot

  const selected = useMemo(
    () => locations.find((l) => l.id === selectedLocationId) ?? null,
    [locations, selectedLocationId]
  );

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
      <div className="w-full flex justify-center items-center h-10 text-muted-foreground rounded-lg border bg-card/40">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        Cargando ubicaciones...
      </div>
    );
  }

  return (
    <div className="w-full">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="group inline-flex items-center justify-between gap-2 rounded-lg
                       border bg-card/80 px-3 py-2 text-sm font-medium text-foreground
                       shadow-sm hover:bg-card transition-colors w-full"
          >
            <span className="inline-flex items-center gap-2 truncate flex-1 text-left">
              <MapPin className="w-4 h-4 text-primary/70 shrink-0" />
              <span className="truncate">
                {selected
                  ? `${selected.title}${
                      selected.city ? " — " + selected.city : ""
                    }`
                  : "Selecciona ubicación"}
              </span>
            </span>
            <ChevronDown className="h-4 w-4 text-foreground/50 group-hover:text-foreground/70 transition-colors shrink-0" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-[280px] max-w-[90vw] rounded-lg"
        >
          {locations.map((l) => {
            const isActive = l.id === selectedLocationId;
            return (
              <DropdownMenuItem
                key={l.id}
                onClick={() => handleSelect(l.id)}
                className={`flex flex-col items-start rounded-md ${
                  isActive ? "bg-primary/10 text-primary" : ""
                }`}
              >
                <span className="truncate w-full text-sm">{l.title}</span>
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
