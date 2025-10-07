"use client";

import CompanyPicker, { type CompanyLite } from "./CompanyPicker";
import { Building2 } from "lucide-react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Label } from "@/app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Input } from "@/app/components/ui/input";

export type LocationRow = { id: string; title: string; city?: string | null };

export default function TopToolbar({
  companies,
  selectedCompanyId,
  onSelectCompany,
  locations,
  locationsLoading,
  locationId,
  onChangeLocation,
  q,
  onChangeQuery,
}: {
  companies: CompanyLite[];
  selectedCompanyId: string | null;
  onSelectCompany: (id: string) => void;

  locations: LocationRow[];
  locationsLoading: boolean;
  locationId: string;
  onChangeLocation: (id: string) => void;

  q: string;
  onChangeQuery: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between">
        <CompanyPicker
          companies={companies}
          selectedCompanyId={selectedCompanyId}
          onSelect={onSelectCompany}
        />
      </div>

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
                  onValueChange={(v) => onChangeLocation(v)}
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

            {/* Búsqueda global (para pestañas que la usen) */}
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Buscar</Label>
              <Input
                className="h-8 w-72"
                placeholder="Nombre, rol o ubicación…"
                value={q}
                onChange={(e) => onChangeQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
