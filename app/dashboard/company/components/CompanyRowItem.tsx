"use client";
import { useEffect } from "react";
import { useCompanyLocations } from "@/hooks/useCompanyLocations";
import { LocationRowItem } from "./LocationRowItem";

export type CompanyRow = {
  id: string;
  name: string;
  activity?: string;
  employees?: string;
};

type Props = {
  row: CompanyRow;
  onAddLocation: (companyId: string) => void;
  onEditCompany: (row: CompanyRow) => void;
  onAddUser: (companyId: string) => void;
  onDeleteCompany: (companyId: string) => void;
};

export function CompanyRowItem({
  row,
  onAddLocation,
  onEditCompany,
  onAddUser,
  onDeleteCompany,
}: Props) {
  const { locations, loading, error, loadLocations } = useCompanyLocations(row.id);

  useEffect(() => {
    loadLocations(); // siempre visibles, se cargan al montar
  }, [row.id]);

  return (
    <div className="border-b">
      {/* Cabecera empresa */}
      <div
        className="p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50"
        onClick={() => onEditCompany(row)}
      >
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{row.name}</div>
          <div className="text-sm text-gray-500">
            {row.activity ?? "—"} • {row.employees ?? "—"} empleados
          </div>
        </div>

        <button
          className="px-3 py-1 text-sm rounded-lg border hover:bg-gray-50"
          onClick={(e) => {
            e.stopPropagation();
            onAddLocation(row.id);
          }}
        >
          Añadir ubicación
        </button>
      </div>

      {/* Ubicaciones (visibles por defecto) */}
      <div className="bg-gray-50 px-10 py-3 space-y-2">
        {loading && <div className="text-sm text-gray-500">Cargando…</div>}
        {error && <div className="text-sm text-red-600">Error: {error}</div>}
        {!loading && !error && (
          locations.length === 0 ? (
            <div className="text-sm text-gray-500">Sin ubicaciones</div>
          ) : (
            locations.map((loc) => (
              <LocationRowItem
                key={loc.id}
                location={loc}
                onAfterChange={loadLocations}
              />
            ))
          )
        )}
      </div>
    </div>
  );
}
