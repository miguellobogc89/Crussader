// app/components/company/LocationSettingsModal.tsx
"use client";

import * as React from "react";
import { MapPin, Building2, Phone, Globe } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";

export type LocationForm = {
  title: string;
  address?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  website?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  values: LocationForm;
  onChange: (patch: Partial<LocationForm>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  submitting?: boolean;
};

export default function LocationSettingsModal({
  open,
  onOpenChange,
  values,
  onChange,
  onSubmit,
  submitting,
}: Props) {
  function handleField<K extends keyof LocationForm>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ [key]: e.target.value } as Pick<LocationForm, K>);
    };
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Configurar ubicación
          </DialogTitle>
          <DialogDescription>
            Revisa y completa la información de tu ubicación. Estos datos se
            usarán en paneles, respuestas y futuras integraciones.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-5 mt-2">
          {/* Nombre comercial */}
          <div className="space-y-1.5">
            <Label htmlFor="loc-title">Nombre de la ubicación</Label>
            <Input
              id="loc-title"
              value={values.title ?? ""}
              onChange={handleField("title")}
              placeholder="Ej. Clínica Centro Sevilla"
              required
            />
          </div>

          {/* Dirección */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Dirección completa
            </Label>
            <Input
              id="loc-address"
              value={values.address ?? ""}
              onChange={handleField("address")}
              placeholder="Calle, número, piso..."
            />
          </div>

          {/* Ciudad / Provincia / CP / País */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="loc-city">Ciudad</Label>
              <Input
                id="loc-city"
                value={values.city ?? ""}
                onChange={handleField("city")}
                placeholder="Sevilla"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loc-region">Provincia / Región</Label>
              <Input
                id="loc-region"
                value={values.region ?? ""}
                onChange={handleField("region")}
                placeholder="Sevilla"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loc-postal">Código postal</Label>
              <Input
                id="loc-postal"
                value={values.postalCode ?? ""}
                onChange={handleField("postalCode")}
                placeholder="41001"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loc-country">País</Label>
              <Input
                id="loc-country"
                value={values.country ?? ""}
                onChange={handleField("country")}
                placeholder="ES / España"
              />
            </div>
          </div>

          {/* Contacto */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5" htmlFor="loc-phone">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Teléfono
              </Label>
            <Input
                id="loc-phone"
                value={values.phone ?? ""}
                onChange={handleField("phone")}
                placeholder="+34 900 000 000"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5" htmlFor="loc-website">
                <Globe className="h-4 w-4 text-muted-foreground" />
                Web
              </Label>
              <Input
                id="loc-website"
                value={values.website ?? ""}
                onChange={handleField("website")}
                placeholder="https://tubussiness.com"
              />
            </div>
          </div>

          {/* Botones */}
          <div className="mt-4 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
