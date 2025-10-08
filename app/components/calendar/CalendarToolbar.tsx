// app/components/calendar/CalendarToolbar.tsx
"use client";

import { useMemo } from "react";
import { Building2, ChevronDown } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/app/components/ui/dropdown-menu";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";

export type CompanyLite = { id: string; name: string; color?: string | null; logoUrl?: string | null; locationsCount?: number };
export type LocationRow = { id: string; title: string; city?: string | null };

type Props = {
  companies: CompanyLite[];
  selectedCompanyId?: string | null;
  onSelectCompany: (id: string) => void;

  locations: LocationRow[];
  locationsLoading: boolean;
  locationId: string;
  onChangeLocation: (v: string) => void;

  selectedDate: Date;
  onChangeDate: (d: Date) => void;

  listMsg: string;
  onRefresh: () => void;
};

export default function CalendarToolbar({
  companies,
  selectedCompanyId,
  onSelectCompany,
  locations,
  locationsLoading,
  locationId,
  onChangeLocation,
  selectedDate,
  onChangeDate,
  listMsg,
  onRefresh,
}: Props) {
  const selectedCompany = useMemo(
    () => companies.find((c) => c.id === selectedCompanyId) ?? companies[0],
    [companies, selectedCompanyId]
  );

  const dotStyle =
    (selectedCompany?.color ?? "").toString() ||
    "linear-gradient(135deg, #A78BFA 0%, #F472B6 100%)";

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Company picker */}
      <div className="flex items-center justify-between">
        <CompanyPicker
          companies={companies}
          selected={selectedCompany?.id ?? null}
          onSelect={(id) => onSelectCompany(id)}
          dotStyle={dotStyle}
        />
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Ubicación */}
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Ubicación</Label>
              {locationsLoading ? (
                <div className="text-xs text-muted-foreground">Cargando ubicaciones…</div>
              ) : (
                <Select
                  value={locationId || ""}
                  onValueChange={onChangeLocation}
                  disabled={!locations.length}
                >
                  <SelectTrigger className="w-72 h-8">
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
              )}
            </div>

            {/* Fecha */}
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Fecha</Label>
              <Input
                className="h-8"
                type="date"
                value={selectedDate.toISOString().slice(0, 10)}
                onChange={(e) => onChangeDate(new Date(e.target.value + "T00:00:00"))}
              />
            </div>

            <Button onClick={onRefresh} variant="outline" className="h-8">
              Refrescar
            </Button>

            {listMsg && <span className="text-sm">{listMsg}</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- Subcomponentes internos ---------- */

function CompanyPicker({
  companies,
  selected,
  onSelect,
  dotStyle,
}: {
  companies: CompanyLite[];
  selected: string | null;
  onSelect: (id: string) => void;
  dotStyle: string;
}) {
  const active = companies.find((c) => c.id === selected);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="
            group inline-flex items-center gap-3
            rounded-full border border-border/80 bg-background
            px-3.5 py-2 text-sm font-medium
            shadow-sm hover:shadow
            transition-all
            hover:border-foreground/20
            focus:outline-none focus-visible:ring-2 focus-visible:ring-ring
          "
        >
          <span
            aria-hidden
            className="h-3.5 w-3.5 rounded-full ring-1 ring-black/5"
            style={{
              background: dotStyle.startsWith("#") ? undefined : (dotStyle as string),
              backgroundColor: dotStyle.startsWith("#") ? dotStyle : undefined,
            }}
          />
          <span className="text-foreground/90">
            {active ? active.name : "Selecciona empresa"}
          </span>
          <ChevronDown className="h-4 w-4 text-foreground/50 group-hover:text-foreground/70 transition-colors" />
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
          <DropdownMenuItem
            key={c.id}
            className="flex items-center gap-3"
            onClick={() => onSelect(c.id)}
          >
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
            {/* Indicador simple del activo */}
            {active?.id === c.id && (
              <ChevronDown className="ml-2 h-4 w-4 rotate-180 text-foreground/70 shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
