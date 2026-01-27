//app/components/calendar/CalendarHeader.tsx
"use client";

import { useMemo, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { Building2, ChevronDown, Plus, Settings } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/app/components/ui/select";

export type CompanyLite = {
  id: string;
  name: string;
  color?: string | null;
  logoUrl?: string | null;
  locationsCount?: number;
};
export type LocationRow = { id: string; title: string; city?: string | null };

type Props = {
  companies: CompanyLite[];
  selectedCompanyId?: string | null;
  onSelectCompany: (id: string) => void;

  locations: LocationRow[];
  locationsLoading: boolean;
  locationId: string;
  onChangeLocation: (v: string) => void;

  onCreateAppointment: () => void;
  settingsHref?: string;
  disableCreate?: boolean;

  /** ➕ nuevo: notifica la altura real del header (en px) */
  onMeasureHeight?: (px: number) => void;
};

export default function CalendarHeader({
  companies,
  selectedCompanyId,
  onSelectCompany,
  locations,
  locationsLoading,
  locationId,
  onChangeLocation,
  onCreateAppointment,
  settingsHref = "/dashboard/calendar/settings",
  disableCreate = false,
  onMeasureHeight,
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  // mide altura al montar y al redimensionar
  useLayoutEffect(() => {
    function measure() {
      if (!rootRef.current) return;
      const h = rootRef.current.getBoundingClientRect().height;
      onMeasureHeight?.(Math.round(h));
    }
    measure();
    // re-medir en resize (y fuentes/cambios de zoom)
    window.addEventListener("resize", measure);
    const id = window.setInterval(measure, 400); // fallback por si cambia contenido
    return () => {
      window.removeEventListener("resize", measure);
      window.clearInterval(id);
    };
  }, [onMeasureHeight]);

  const selectedCompany = useMemo(
    () => companies.find((c) => c.id === selectedCompanyId) ?? companies[0],
    [companies, selectedCompanyId]
  );

  const dotStyle =
    (selectedCompany?.color ?? "").toString() ||
    "linear-gradient(135deg, #A78BFA 0%, #F472B6 100%)";

  return (
    <div ref={rootRef} className="w-full ">
      {/* línea única */}
      <div className="flex items-center justify-between py-2 gap-3">
        {/* IZQ: empresa + ubicación (select largo) */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <CompanyPickerCompact
            companies={companies}
            selected={selectedCompany?.id ?? null}
            onSelect={onSelectCompany}
            dotStyle={dotStyle}
          />

          <div className="h-5 w-px bg-border/70 mx-1" />

          <LocationPickerCompact
            locations={locations}
            loading={locationsLoading}
            value={locationId}
            onChange={onChangeLocation}
          />
        </div>

        {/* DER: acciones */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow"
            onClick={onCreateAppointment}
            disabled={disableCreate}
            title={disableCreate ? "Selecciona una ubicación" : "Nueva cita"}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva cita
          </Button>

          <Button asChild variant="outline" size="icon" title="Ajustes">
            <Link href={settingsHref}>
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

/* --------- Subcomponentes compactos --------- */

function CompanyPickerCompact({
  companies, selected, onSelect, dotStyle,
}: {
  companies: CompanyLite[]; selected: string | null; onSelect: (id: string) => void; dotStyle: string;
}) {
  const active = companies.find((c) => c.id === selected);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background px-3 py-1.5 text-sm hover:border-foreground/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          title="Seleccionar empresa"
        >
          <span
            aria-hidden
            className="h-3 w-3 rounded-full ring-1 ring-black/5"
            style={{
              background: dotStyle.startsWith("#") ? undefined : (dotStyle as string),
              backgroundColor: dotStyle.startsWith("#") ? dotStyle : undefined,
            }}
          />
          <span className="text-foreground/90 max-w-[240px] truncate">
            {active ? active.name : "Selecciona empresa"}
          </span>
          <ChevronDown className="h-4 w-4 text-foreground/60" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Tus empresas
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {companies.length === 0 && <DropdownMenuItem disabled>Sin empresas</DropdownMenuItem>}
        {companies.map((c) => (
          <DropdownMenuItem key={c.id} className="flex items-center gap-3" onClick={() => onSelect(c.id)}>
            <span
              aria-hidden
              className="h-3 w-3 rounded-full ring-1 ring-black/5 shrink-0"
              style={{
                background: c.color && !c.color.startsWith("#") ? (c.color as string) : undefined,
                backgroundColor: c.color && c.color.startsWith("#") ? c.color : undefined,
              }}
            />
            <span className="flex-1 truncate">{c.name}</span>
            <span className="ml-2 tabular-nums text-xs text-muted-foreground shrink-0">
              ({c.locationsCount ?? 0})
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function LocationPickerCompact({
  locations, loading, value, onChange,
}: {
  locations: LocationRow[]; loading: boolean; value: string; onChange: (v: string) => void;
}) {
  if (loading) return <div className="text-xs text-muted-foreground px-2 py-1">Cargando ubicaciones…</div>;
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Select value={value || ""} onValueChange={onChange} disabled={!locations.length}>
        <SelectTrigger className="h-8 w-[380px] md:w-[520px] lg:w-[720px]">
          <SelectValue placeholder={locations.length ? "Selecciona ubicación" : "Sin ubicaciones"} />
        </SelectTrigger>
        <SelectContent>
          {locations.map((l) => (
            <SelectItem key={l.id} value={l.id}>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span>{l.title}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
