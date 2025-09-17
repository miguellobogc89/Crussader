"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs";
import { SearchableSelect, type Option } from "@/app/components/ui/searchable-select";

export type NewLocation = {
  title: string;
  address?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
  website?: string;
  activityId?: string; // ← NUEVO
  typeId?: string;     // ← NUEVO (Categoría)
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmitSingle: (loc: NewLocation) => Promise<void> | void;
  onSubmitBulk: (locs: NewLocation[]) => Promise<void> | void;
  submitting?: boolean;
};

export function AddLocationsModal({
  open,
  onOpenChange,
  onSubmitSingle,
  onSubmitBulk,
  submitting,
}: Props) {
  const [tab, setTab] = React.useState<"single" | "bulk">("single");

  const [f, setF] = React.useState<NewLocation>({
    title: "",
    address: "",
    city: "",
    postalCode: "",
    phone: "",
    website: "",
    activityId: undefined,
    typeId: undefined,
  });

  const [bulkText, setBulkText] = React.useState("");

  // Datos para picklists
  const [activities, setActivities] = React.useState<Option[]>([]);
  const [loadingActivities, setLoadingActivities] = React.useState(false);

  const [types, setTypes] = React.useState<Option[]>([]);
  const [loadingTypes, setLoadingTypes] = React.useState(false);

  // Cargar actividades al abrir por primera vez
  React.useEffect(() => {
    if (!open || activities.length > 0) return;
    setLoadingActivities(true);
    fetch("/api/catalog/activities")
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => {
        const list: Option[] = Array.isArray(data) ? data : data?.activities ?? [];
        setActivities(list);
      })
      .catch(() => setActivities([]))
      .finally(() => setLoadingActivities(false));
  }, [open, activities.length]);

  // Cuando cambia actividad → limpiar categoría y cargar tipos
  React.useEffect(() => {
    if (!f.activityId) {
      setTypes([]);
      setF((p) => ({ ...p, typeId: undefined }));
      return;
    }
    setLoadingTypes(true);
    fetch(`/api/catalog/types?activityId=${encodeURIComponent(f.activityId)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => {
        const list: Option[] = Array.isArray(data) ? data : data?.types ?? [];
        setTypes(list);
      })
      .catch(() => setTypes([]))
      .finally(() => setLoadingTypes(false));
  }, [f.activityId]);

  function reset() {
    setF({
      title: "",
      address: "",
      city: "",
      postalCode: "",
      phone: "",
      website: "",
      activityId: undefined,
      typeId: undefined,
    });
    setTypes([]);
    setBulkText("");
  }

  async function submitSingle(e: React.FormEvent) {
    e.preventDefault();
    if (!f.title.trim() || !f.activityId || !f.typeId) return;
    await onSubmitSingle({
      title: f.title.trim(),
      address: f.address?.trim() || undefined,
      city: f.city?.trim() || undefined,
      postalCode: f.postalCode?.trim() || undefined,
      phone: f.phone?.trim() || undefined,
      website: f.website?.trim() || undefined,
      activityId: f.activityId,
      typeId: f.typeId,
    });
    reset();
  }

  async function submitBulk(e: React.FormEvent) {
    e.preventDefault();
    const lines = bulkText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const rows: NewLocation[] = lines
      .map((line) => {
        // Formato: Título | Dirección | Ciudad | CP
        const [title, address, city, postalCode] = line.split("|").map((s) => (s ?? "").trim());
        return { title, address, city, postalCode };
      })
      .filter((r) => r.title.length > 0);

    if (rows.length === 0) return;
    await onSubmitBulk(rows);
    reset();
  }

  const canSubmitSingle = !!f.title.trim() && !!f.activityId && !!f.typeId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Añadir ubicación</DialogTitle>
          <DialogDescription>
            Crea una ubicación individual o pega varias (una por línea).
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="mb-4">
            <TabsTrigger value="single">Individual</TabsTrigger>
            <TabsTrigger value="bulk">Varias</TabsTrigger>
          </TabsList>

          <TabsContent value="single">
            <form onSubmit={submitSingle} className="space-y-3">
              <div className="grid gap-2">
                <Label htmlFor="t">Nombre</Label>
                <Input
                  id="t"
                  value={f.title}
                  onChange={(e) => setF((p) => ({ ...p, title: e.target.value }))}
                  required
                />
              </div>

              {/* Actividad */}
              <div className="grid gap-2">
                <Label>Actividad</Label>
                <SearchableSelect
                  value={f.activityId ?? null}
                  onChange={(id) =>
                    setF((p) => ({
                      ...p,
                      activityId: id ?? undefined,
                      typeId: undefined, // reset categoría al cambiar actividad
                    }))
                  }
                  options={activities}
                  placeholder="Selecciona actividad"
                  searchPlaceholder="Buscar actividad..."
                  disabled={loadingActivities}
                  loading={loadingActivities}
                />
              </div>

              {/* Categoría (Tipo) dependiente */}
              <div className="grid gap-2">
                <Label>Categoría</Label>
                <SearchableSelect
                  value={f.typeId ?? null}
                  onChange={(id) => setF((p) => ({ ...p, typeId: id ?? undefined }))}
                  options={types}
                  placeholder={f.activityId ? "Selecciona categoría" : "Selecciona actividad primero"}
                  searchPlaceholder="Buscar categoría..."
                  disabled={!f.activityId || loadingTypes}
                  loading={loadingTypes}
                />
              </div>

              <div className="grid gap-2">
                <Label>Dirección</Label>
                <Input value={f.address} onChange={(e) => setF((p) => ({ ...p, address: e.target.value }))} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Ciudad</Label>
                  <Input value={f.city} onChange={(e) => setF((p) => ({ ...p, city: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Código Postal</Label>
                  <Input value={f.postalCode} onChange={(e) => setF((p) => ({ ...p, postalCode: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Teléfono</Label>
                  <Input value={f.phone} onChange={(e) => setF((p) => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Web</Label>
                  <Input value={f.website} onChange={(e) => setF((p) => ({ ...p, website: e.target.value }))} />
                </div>
              </div>

              <DialogFooter className="mt-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting || !canSubmitSingle}>
                  {submitting ? "Añadiendo..." : "Añadir"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="bulk">
            <form onSubmit={submitBulk} className="space-y-3">
              <div className="grid gap-2">
                <Label>Ubicaciones (una por línea)</Label>
                <Textarea
                  rows={6}
                  placeholder={`Tienda Centro | C/ Mayor 12 | Sevilla | 41001
Bar Norte | Av. Norte 5 | Sevilla | 41002`}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Formato: <strong>Nombre | Dirección | Ciudad | CP</strong>. Los campos después del nombre son
                  opcionales.
                </p>
              </div>

              <DialogFooter className="mt-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Añadiendo..." : "Añadir todas"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
  