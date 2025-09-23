// app/components/admin/EditLocationModal.tsx
"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter as AlertFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/components/ui/alert-dialog";
import { SearchableSelect, type Option } from "@/app/components/ui/searchable-select";

type MinimalLocation = {
  title?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  companyId?: string | null;
  company?: { id: string; name: string } | null;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  locationId: string;
  onSaved?: () => void; // opcional
};

export default function EditLocationModal({
  open,
  onOpenChange,
  locationId,
  onSaved,
}: Props) {
  const router = useRouter();

  // estado de carga/guardado
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // --- Campos básicos ---
  const [title, setTitle] = React.useState("");

  // Dirección modularizada (por ahora placeholders; combinamos para payload.address)
  const [streetName, setStreetName] = React.useState("");   // nombre de vía
  const [streetNumber, setStreetNumber] = React.useState(""); // número
  const [postalCode, setPostalCode] = React.useState("");
  const [city, setCity] = React.useState("");

  // Empresa
  const [companyId, setCompanyId] = React.useState<string>("");
  const [companies, setCompanies] = React.useState<Option[]>([]);
  const [loadingCompanies, setLoadingCompanies] = React.useState(false);

  // Snapshot inicial para saber si hay cambios
  const [initial, setInitial] = React.useState<MinimalLocation | null>(null);

  // Cargar valores actuales al abrir
  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);

        // 1) Detalle de la ubicación
        const res = await fetch(`/api/admin/locations/${locationId}`);
        if (!res.ok) throw new Error("No se pudo cargar la ubicación");
        const loc = (await res.json()) as MinimalLocation;

        if (cancelled) return;

        const t = loc.title ?? "";
        const a = (loc.address ?? "").trim();
        const c = loc.city ?? "";
        const cp = loc.postalCode ?? "";
        const cid = loc.companyId ?? loc.company?.id ?? "";

        // Pequeño split aproximado de address -> calle y número (si llegara junto)
        // (No pasa nada si no aplica: dejamos en nombre de vía y número lo que corresponda manualmente)
        let guessedStreetName = streetName;
        let guessedStreetNumber = streetNumber;
        if (a && (!streetName || !streetNumber)) {
          const parts = a.split(",")[0]?.trim() ?? a;
          const match = parts.match(/^(.*?)[\s,]+(\d+[A-Za-z\-\/]?)$/);
          if (match) {
            guessedStreetName = match[1].trim();
            guessedStreetNumber = match[2].trim();
          } else {
            guessedStreetName = parts;
            guessedStreetNumber = "";
          }
        }

        setTitle(t);
        setStreetName(guessedStreetName || "");
        setStreetNumber(guessedStreetNumber || "");
        setPostalCode(cp);
        setCity(c);
        setCompanyId(cid);

        setInitial({
          title: t,
          address: a,
          city: c,
          postalCode: cp,
          companyId: cid || null,
          company: loc.company ?? null,
        });

        // 2) Empresas (todas)
        setLoadingCompanies(true);
        // Preferente: search con q vacío
        const sr = await fetch(`/api/admin/companies/search?q=`);
        let list: Option[] = [];
        if (sr.ok) {
          const data = await sr.json();
          const arr = Array.isArray(data) ? data : data?.items ?? [];
          list = arr.map((c: any) => ({ id: String(c.id), label: String(c.name) }));
        } else {
          // Fallback
          const r2 = await fetch(`/api/admin/companies`);
          if (r2.ok) {
            const data2 = await r2.json();
            const arr2 = Array.isArray(data2) ? data2 : data2?.items ?? [];
            list = arr2.map((c: any) => ({ id: String(c.id), label: String(c.name) }));
          }
        }
        if (!cancelled) setCompanies(list);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingCompanies(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, locationId]);

  const isDirty =
    initial != null &&
    (
      title !== (initial.title ?? "") ||
      city !== (initial.city ?? "") ||
      postalCode !== (initial.postalCode ?? "") ||
      companyId !== (initial.companyId ?? "") ||
      // si cambian los placeholders de dirección, también cuenta como cambio
      streetName + streetNumber !== (initial.address ?? "")
    );

  // Reglas mínimas para activar Guardar:
  // titulo, empresa, y dirección modularizada con CP y Ciudad
  const canSave =
    !saving &&
    !loading &&
    title.trim().length > 0 &&
    companyId.trim().length > 0 &&
    streetName.trim().length > 0 &&
    streetNumber.trim().length > 0 &&
    postalCode.trim().length > 0 &&
    city.trim().length > 0 &&
    isDirty;

  async function handleSave(e?: React.FormEvent) {
    e?.preventDefault();
    if (!canSave) return;

    try {
      setSaving(true);

      // Combinar la dirección modularizada (placeholder) en address
      const combinedAddress = `${streetName.trim()} ${streetNumber.trim()}`.trim();

      const payload = {
        title: title.trim(),
        address: combinedAddress,         // por ahora lo unificamos aquí
        city: city.trim(),
        postalCode: postalCode.trim(),
        companyId: companyId || null,
      };

      const res = await fetch(`/api/admin/locations/${locationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("No se pudo guardar la ubicación");

      onOpenChange(false);
      onSaved?.();
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      const res = await fetch(`/api/admin/locations/${locationId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("No se pudo eliminar la ubicación");
      onOpenChange(false);
      onSaved?.();
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Editar ubicación</DialogTitle>
        </DialogHeader>

        {/* Sección 1: Identificación y dirección (2 columnas) */}
        <form className="space-y-6" onSubmit={handleSave}>
          <section className="space-y-3">
            <h4 className="text-sm font-semibold text-neutral-900">Identificación y dirección</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 grid gap-2">
                <Label htmlFor="title">Título / nombre público</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej.: Heladería Centro"
                  disabled={loading || saving}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="streetName">Nombre de vía</Label>
                <Input
                  id="streetName"
                  value={streetName}
                  onChange={(e) => setStreetName(e.target.value)}
                  placeholder="Calle Mayor, Av. de la Constitución…"
                  disabled={loading || saving}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="streetNumber">Número</Label>
                <Input
                  id="streetNumber"
                  value={streetNumber}
                  onChange={(e) => setStreetNumber(e.target.value)}
                  placeholder="12"
                  disabled={loading || saving}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="postalCode">Código Postal</Label>
                <Input
                  id="postalCode"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="28013"
                  disabled={loading || saving}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Madrid"
                  disabled={loading || saving}
                />
              </div>

              {/* Huecos para futuros campos (región/país/planta/etc.) */}
              <div className="grid gap-2 opacity-60">
                <Label>Región / Provincia (próximamente)</Label>
                <Input disabled placeholder="—" />
              </div>
              <div className="grid gap-2 opacity-60">
                <Label>País (próximamente)</Label>
                <Input disabled placeholder="—" />
              </div>
            </div>
          </section>

          {/* Sección 2: Relaciones (dos columnas: Empresa / Usuarios) */}
          <section className="space-y-3">
            <h4 className="text-sm font-semibold text-neutral-900">Relaciones</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Columna 1: Empresa */}
              <div className="grid gap-2">
                <Label>Empresa</Label>
                <SearchableSelect
                  value={companyId || null}
                  onChange={(id) => setCompanyId(id ?? "")}
                  options={companies}
                  placeholder="Selecciona empresa"
                  searchPlaceholder="Buscar empresa..."
                  disabled={loadingCompanies || loading || saving}
                  loading={loadingCompanies}
                />
                <p className="text-xs text-muted-foreground">
                  Mostrando todas las empresas {loadingCompanies ? "(cargando…)" : ""}.
                </p>
              </div>

              {/* Columna 2: Usuarios (vacío por ahora) */}
              <div className="grid gap-2">
                <Label>Usuarios</Label>
                <div className="h-10 rounded-md border bg-neutral-50 text-neutral-400 grid place-items-center">
                  (pendiente)
                </div>
              </div>
            </div>
          </section>

          {/* Botonera: izquierda rojo (eliminar) · centro cancelar · derecha guardar morado */}
          <DialogFooter className="flex items-center justify-between gap-2">
            {/* Izquierda: Eliminar */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700"
                  disabled={saving}
                >
                  Eliminar ubicación
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar esta ubicación?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se perderán todos los datos asociados a esta ubicación. Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700"
                    onClick={handleDelete}
                  >
                    Eliminar definitivamente
                  </AlertDialogAction>
                </AlertFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Derecha: Cancelar + Guardar */}
            <div className="ml-auto flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={!canSave}
              >
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
