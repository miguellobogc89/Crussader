// app/components/onboardingsteps/CreateLocationStep.tsx
"use client";

import * as React from "react";
import type {
  OnboardingStepProps,
  LocationFormState,
} from "@/app/components/onboarding/steps";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  SearchableSelect,
  type Option,
} from "@/app/components/ui/searchable-select";
import { Button } from "@/app/components/ui/button";

export function CreateLocationStep({
  state,
  setState,
}: OnboardingStepProps) {
  const f: LocationFormState = state.locationForm;

  const [activities, setActivities] = React.useState<Option[]>([]);
  const [loadingActivities, setLoadingActivities] = React.useState(false);

  const [types, setTypes] = React.useState<Option[]>([]);
  const [loadingTypes, setLoadingTypes] = React.useState(false);

  const [creating, setCreating] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const locationCreated = !!state.locationCreated;

  // Helper para actualizar locationForm
  function updateField<K extends keyof LocationFormState>(
    key: K,
    value: LocationFormState[K],
  ) {
    setState({
      locationForm: {
        ...state.locationForm,
        [key]: value,
      },
    });
  }

  // Cargar actividades al montar (una vez)
  React.useEffect(() => {
    if (activities.length > 0) return;
    setLoadingActivities(true);
    fetch("/api/catalog/activities")
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => {
        const list: Option[] = Array.isArray(data)
          ? data
          : data?.activities ?? [];
        setActivities(list);
      })
      .catch(() => setActivities([]))
      .finally(() => setLoadingActivities(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cuando cambia activityId -> limpiar types y cargar tipos
  React.useEffect(() => {
    if (!f.activityId) {
      setTypes([]);
      updateField("typeId", undefined);
      return;
    }
    setLoadingTypes(true);
    fetch(`/api/catalog/types?activityId=${encodeURIComponent(f.activityId)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => {
        const list: Option[] = Array.isArray(data)
          ? data
          : data?.types ?? [];
        setTypes(list);
      })
      .catch(() => setTypes([]))
      .finally(() => setLoadingTypes(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.activityId]);

  const canSubmit =
    f.title.trim().length > 0 && !!f.activityId && !!f.typeId;

  async function handleCreateLocation() {
    setErrorMsg(null);

    if (!canSubmit) {
      setErrorMsg(
        "Para crear el establecimiento, rellena al menos nombre, actividad y categoría.",
      );
      return;
    }

    setCreating(true);
    try {
      const {
        title,
        address,
        city,
        postalCode,
        phone,
        website,
        activityId,
        typeId,
      } = state.locationForm;

      const res = await fetch("/api/mybusiness/locations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          address,
          city,
          postalCode,
          phone,
          website,
          activityId,
          typeId,
        }),
      });

      const data = await res.json().catch(() => null);

      console.log(
        "[Onboarding] locations/create response",
        res.status,
        data,
      );

      if (!res.ok || !data?.ok) {
        console.error("❌ Error creando Location:", res.status, data);
        setErrorMsg(
          "No se ha podido crear el establecimiento. Inténtalo de nuevo.",
        );
        return;
      }

      // Marcamos en el flow que la ubicación está creada;
      // el footer se habilita (canGoNext) y la page hará el salto a la pantalla final.
      setState({
        locationCreated: true,
      });
    } catch (err) {
      console.error("❌ Error creando Location:", err);
      setErrorMsg(
        "Ha ocurrido un error creando el establecimiento.",
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-4 text-slate-700">
      <p className="text-sm leading-relaxed">
        Este será el{" "}
        <span className="font-semibold">primer establecimiento</span> que
        vas a gestionar con Crussader. Más adelante podrás añadir más
        ubicaciones si lo necesitas.
      </p>

      <div className="grid gap-2">
        <Label htmlFor="loc-title">Nombre del establecimiento</Label>
        <Input
          id="loc-title"
          value={f.title}
          onChange={(e) => updateField("title", e.target.value)}
          placeholder="Clínica Centro, Restaurante Norte..."
        />
      </div>

      {/* Actividad */}
      <div className="grid gap-2">
        <Label>Actividad</Label>
        <SearchableSelect
          value={f.activityId ?? null}
          onChange={(id) =>
            updateField("activityId", id ?? undefined)
          }
          options={activities}
          placeholder="Selecciona actividad"
          searchPlaceholder="Buscar actividad..."
          disabled={loadingActivities}
          loading={loadingActivities}
        />
      </div>

      {/* Categoría */}
      <div className="grid gap-2">
        <Label>Categoría</Label>
        <SearchableSelect
          value={f.typeId ?? null}
          onChange={(id) => updateField("typeId", id ?? undefined)}
          options={types}
          placeholder={
            f.activityId
              ? "Selecciona categoría"
              : "Selecciona actividad primero"
          }
          searchPlaceholder="Buscar categoría..."
          disabled={!f.activityId || loadingTypes}
          loading={loadingTypes}
        />
      </div>

      <div className="grid gap-2">
        <Label>Dirección</Label>
        <Input
          value={f.address}
          onChange={(e) => updateField("address", e.target.value)}
          placeholder="C/ Principal 123"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label>Ciudad</Label>
          <Input
            value={f.city}
            onChange={(e) => updateField("city", e.target.value)}
            placeholder="Sevilla"
          />
        </div>
        <div className="grid gap-2">
          <Label>Código Postal</Label>
          <Input
            value={f.postalCode}
            onChange={(e) =>
              updateField("postalCode", e.target.value)
            }
            placeholder="41001"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label>Teléfono</Label>
          <Input
            value={f.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            placeholder="+34 600 000 000"
          />
        </div>
        <div className="grid gap-2">
          <Label>Web</Label>
          <Input
            value={f.website}
            onChange={(e) => updateField("website", e.target.value)}
            placeholder="https://tusitio.com"
          />
        </div>
      </div>

      {!canSubmit && (
        <p className="text-xs text-amber-600">
          Para continuar, rellena al menos el nombre, la actividad y la
          categoría del establecimiento.
        </p>
      )}

      {errorMsg && (
        <p className="text-xs text-red-600">{errorMsg}</p>
      )}

      <div className="pt-2 flex justify-end">
        {!locationCreated ? (
          <Button
            type="button"
            onClick={handleCreateLocation}
            disabled={creating || !canSubmit}
          >
            {creating ? "Creando establecimiento..." : "Crear establecimiento"}
          </Button>
        ) : (
          <p className="text-xs text-emerald-600">
            Establecimiento creado correctamente. Pulsa{" "}
            <span className="font-semibold">Siguiente</span> para continuar.
          </p>
        )}
      </div>
    </div>
  );
}
