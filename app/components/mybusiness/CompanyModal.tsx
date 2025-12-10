"use client";

import * as React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/app/components/ui/select";

export const EMP_BANDS = ["1-10","11-50","51-200","201-500","501-1000","1000+"] as const;
export type EmpBand = typeof EMP_BANDS[number];

export type CompanyForm = {
  name: string;
  email: string;
  phone: string;
  address: string;
  employeesBand: string; // "" = sin especificar
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  values: CompanyForm;
  onChange: (patch: Partial<CompanyForm>) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting?: boolean;
};

export function CompanyModal({
  open, onOpenChange, mode, values, onChange, onSubmit, submitting,
}: Props) {
  const title = mode === "create" ? "Crear empresa" : "Gestionar empresa";
  const desc  = mode === "create"
    ? "Introduce los datos básicos para crear la empresa."
    : "Actualiza los datos que se muestran en la primera tarjeta.";

  // Si no hay banda elegida, Select debe recibir `undefined`, no "".
  const selectValue = values.employeesBand ? values.employeesBand : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{desc}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" value={values.name} onChange={e => onChange({ name: e.target.value })} required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={values.email} onChange={e => onChange({ email: e.target.value })} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" value={values.phone} onChange={e => onChange({ phone: e.target.value })} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address">Dirección</Label>
            <Input id="address" value={values.address} onChange={e => onChange({ address: e.target.value })} />
          </div>

          <div className="grid gap-2">
            <Label>Empleados</Label>
            <Select
              value={selectValue}
              onValueChange={(v) => onChange({ employeesBand: v === "__none__" ? "" : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una banda" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Sin especificar</SelectItem>
                {EMP_BANDS.map(b => (
                  <SelectItem key={b} value={b}>{b} empleados</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Guardando..." : (mode === "create" ? "Crear" : "Guardar")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
