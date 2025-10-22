"use client";

import { useMemo } from "react";
import { useBootstrapData } from "@/app/providers/bootstrap-store";
import LocationSelector, { type LocationLite } from "@/app/components/crussader/LocationSelector";
// (Solo para tipado del payload; no usamos el componente)
import type { CompanyLite } from "@/app/components/crussader/CompanySelector";

export type CompanyLocationChange = {
  companyId: string | null;
  company: CompanyLite | null | undefined;
  locationId: string | null;
  location: LocationLite | null | undefined;
};

// Resuelve la company activa desde el bootstrap (id + name + lo que tengas disponible)
function resolveCompany(boot: unknown): { id: string | null; company: CompanyLite | null } {
  const b = (boot ?? {}) as Record<string, any>;
  const raw =
    b?.activeCompany ??
    b?.company ??
    (Array.isArray(b?.companies) ? b.companies[0] : null) ??
    null;

  const id =
    raw?.id ??
    b?.activeCompanyId ??
    b?.companyId ??
    null;

  // Tipado mínimo compatible con CompanyLite (ajusta si necesitas más campos)
  const company: CompanyLite | null = raw
    ? {
        id: String(raw.id ?? id ?? ""),
        name: String(raw.name ?? b?.companyName ?? "Compañía"),
        // añade aquí campos opcionales si tu CompanyLite los define
      } as CompanyLite
    : id
    ? ({ id: String(id), name: String(b?.companyName ?? "Compañía") } as CompanyLite)
    : null;

  return { id: id ? String(id) : null, company };
}

export function CompanyLocationShell({
  onChange,
  className = "",
}: {
  onChange?: (payload: CompanyLocationChange) => void;
  className?: string;
}) {
  const boot = useBootstrapData();
  const { id: companyId, company } = useMemo(() => resolveCompany(boot), [boot]);

  // Si aún no hay company en bootstrap, mostramos selector de ubicación deshabilitado (mismo look & feel)
  const disabled = !companyId;

  return (
    <div className={`flex gap-2 items-end ${className}`}>
      <LocationSelector
        key={companyId ?? "no-company"}
        companyId={companyId}
        onSelect={(locationId, location) => {
          if (!onChange) return;
          // Emitimos siempre el payload con la company del bootstrap
          onChange({
            companyId,
            company,
            locationId,
            location,
          });
        }}
        className={disabled ? "opacity-70 pointer-events-none" : ""}
      />
    </div>
  );
}

export default CompanyLocationShell;
