// app/components/onboarding/steps/CreateCompanyAndLocation.tsx
"use client";

import * as React from "react";
import type {
  OnboardingStepProps,
  LocationFormState,
  CompanyFormState,
} from "@/app/components/onboarding/steps";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  SearchableSelect,
  type Option,
} from "@/app/components/ui/searchable-select";

const EMP_BANDS = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+",
] as const;

export function CreateCompanyAndLocation({
  state,
  setState,
}: OnboardingStepProps) {
  const companyForm: CompanyFormState = state.companyForm;
  const loc: LocationFormState = state.locationForm;

  const [activities, setActivities] = React.useState<Option[]>([]);
  const [loadingActivities, setLoadingActivities] = React.useState(false);

  const [types, setTypes] = React.useState<Option[]>([]);
  const [loadingTypes, setLoadingTypes] = React.useState(false);

  // Helpers para actualizar el estado global
  function updateCompany<K extends keyof CompanyFormState>(
    key: K,
    value: CompanyFormState[K],
  ) {
    setState({
      companyForm: {
        ...companyForm,
        [key]: value,
      },
    });
  }

  function updateLocation<K extends keyof LocationFormState>(
    key: K,
    value: LocationFormState[K],
  ) {
    setState({
      locationForm: {
        ...loc,
        [key]: value,
      },
    });
  }

  // Cargar actividades al montar
  React.useEffect(() => {
    let cancelled = false;

    async function loadActivities() {
      setLoadingActivities(true);
      try {
        const res = await fetch("/api/catalog/activities");
        if (!res.ok) {
          if (!cancelled) setActivities([]);
          return;
        }
        const data = await res.json().catch(() => null);
        const list: Option[] = Array.isArray(data)
          ? data
          : data?.activities ?? [];
        if (!cancelled) {
          setActivities(list);
        }
      } catch {
        if (!cancelled) {
          setActivities([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingActivities(false);
        }
      }
    }

    loadActivities();
    return () => {
      cancelled = true;
    };
  }, []);

  // Cargar tipos cuando cambia activityId
  React.useEffect(() => {
    let cancelled = false;

    async function loadTypes() {
      if (!loc.activityId) {
        setTypes([]);
        return;
      }

      setLoadingTypes(true);
      try {
        const res = await fetch(
          `/api/catalog/types?activityId=${encodeURIComponent(
            loc.activityId,
          )}`,
        );
        if (!res.ok) {
          if (!cancelled) setTypes([]);
          return;
        }
        const data = await res.json().catch(() => null);
        const list: Option[] = Array.isArray(data)
          ? data
          : data?.types ?? [];
        if (!cancelled) {
          setTypes(list);
        }
      } catch {
        if (!cancelled) {
          setTypes([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingTypes(false);
        }
      }
    }

    loadTypes();
    return () => {
      cancelled = true;
    };
  }, [loc.activityId]);

  const selectEmployeesValue =
    companyForm.employeesBand && companyForm.employeesBand.length > 0
      ? companyForm.employeesBand
      : undefined;

  return (
    <div className="space-y-6 text-slate-700">
      <p className="text-sm leading-relaxed">
        Vamos a crear tu{" "}
        <span className="font-semibold">empresa</span> y tu{" "}
        <span className="font-semibold">primer establecimiento</span> en un solo paso.
      </p>

      {/* Empresa */}
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="company-name-combined">Nombre de la empresa</Label>
          <Input
            id="company-name-combined"
            value={companyForm.name}
            onChange={(e) => updateCompany("name", e.target.value)}
            placeholder="Ej. Clínica Dental Salud SL"
          />
        </div>

        <div className="grid gap-2">
          <Label>Número de empleados</Label>
          <select
            className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={selectEmployeesValue ?? "__none__"}
            onChange={(e) =>
              updateCompany(
                "employeesBand",
                e.target.value === "__none__" ? "" : e.target.value,
              )
            }
          >
            <option value="__none__">Sin especificar</option>
            {EMP_BANDS.map((b) => (
              <option key={b} value={b}>
                {b} empleados
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Establecimiento */}
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="loc-title-combined">
            Nombre del establecimiento
          </Label>
          <Input
            id="loc-title-combined"
            value={loc.title}
            onChange={(e) => updateLocation("title", e.target.value)}
            placeholder="Clínica Centro, Restaurante Norte..."
          />
        </div>

        <div className="grid gap-2">
          <Label>Dirección del establecimiento</Label>
          <Input
            value={loc.address}
            onChange={(e) => updateLocation("address", e.target.value)}
            placeholder="C/ Principal 123"
          />
        </div>

        <div className="grid gap-2">
          <Label>Actividad</Label>
          <SearchableSelect
            value={loc.activityId ?? null}
            onChange={(id) => updateLocation("activityId", id ?? undefined)}
            options={activities}
            placeholder="Selecciona actividad"
            searchPlaceholder="Buscar actividad..."
            disabled={loadingActivities}
            loading={loadingActivities}
          />
        </div>

        <div className="grid gap-2">
          <Label>Categoría</Label>
          <SearchableSelect
            value={loc.typeId ?? null}
            onChange={(id) => updateLocation("typeId", id ?? undefined)}
            options={types}
            placeholder={
              loc.activityId
                ? "Selecciona categoría"
                : "Selecciona actividad primero"
            }
            searchPlaceholder="Buscar categoría..."
            disabled={!loc.activityId || loadingTypes}
            loading={loadingTypes}
          />
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Una vez creado, podrás editar estos datos o añadir más establecimientos
        si lo necesitas.
      </p>
    </div>
  );
}
