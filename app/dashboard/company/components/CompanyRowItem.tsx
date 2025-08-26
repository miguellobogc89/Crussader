"use client";

import { useEffect, useRef, useState } from "react";
import { Stars } from "./Stars";
import { Badge } from "./Badge";
import { SyncNowButton } from "@/components/admin/SyncNowButton";
import { useCompanyLocations, type LocationRow } from "@/hooks/useCompanyLocations";



// ====== Tus tipos tal cual ======
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
// =================================

export function CompanyRowItem({
  row,
  onAddLocation,
  onEditCompany,
  onAddUser,
  onDeleteCompany,
}: Props) {
  const [open, setOpen] = useState(false);
  const { locations, loading, error, loadLocations } = useCompanyLocations(row.id);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  async function toggle() {
    if (!open) {
      await loadLocations();
    }
    setOpen((v) => !v);
  }

  return (
    <div>
      <div className="p-4 flex items-center gap-4">
        {/* Desplegar */}
        <button
          onClick={toggle}
          className="w-8 h-8 border rounded flex items-center justify-center hover:bg-gray-50"
          title={open ? "Contraer" : "Desplegar"}
        >
          {open ? "▾" : "▸"}
        </button>

        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{row.name}</div>
          <div className="text-sm text-gray-500">
            {row.activity ?? "—"} • {row.employees ?? "—"} empleados
          </div>
        </div>

        {/* Menú 3 puntos */}
        <div className="relative" ref={menuRef}>
          <button
            className="w-8 h-8 border rounded flex items-center justify-center hover:bg-gray-50"
            onClick={() => setMenuOpen((v) => !v)}
            title="Opciones"
          >
            ⋮
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-lg border bg-white shadow-md z-10">
              <button
                className="w-full text-left px-3 py-2 hover:bg-gray-50"
                onClick={() => {
                  setMenuOpen(false);
                  onAddLocation(row.id);
                }}
              >
                Añadir ubicación
              </button>
              <button
                className="w-full text-left px-3 py-2 hover:bg-gray-50"
                onClick={() => {
                  setMenuOpen(false);
                  onEditCompany(row);
                }}
              >
                Editar
              </button>
              <button
                className="w-full text-left px-3 py-2 hover:bg-gray-50"
                onClick={() => {
                  setMenuOpen(false);
                  onAddUser(row.id);
                }}
              >
                Añadir usuario
              </button>
              <div className="my-1 border-t" />
              <button
                className="w-full text-left px-3 py-2 text-pink-600 hover:bg-pink-50"
                onClick={() => {
                  setMenuOpen(false);
                  onDeleteCompany(row.id);
                }}
              >
                Borrar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Panel de ubicaciones */}
      {open && (
        <div className="bg-gray-50 px-10 py-3 space-y-2">
          {loading && <div className="text-sm text-gray-500">Cargando…</div>}
          {error && <div className="text-sm text-red-600">Error: {error}</div>}

          {!loading && !error && (locations.length === 0 ? (
            <div className="text-sm text-gray-500">Sin ubicaciones</div>
          ) : (
            locations.map((loc) => {
              const addr = [loc.address, loc.city, loc.postalCode].filter(Boolean).join(", ");
              const connected = !!loc.googlePlaceId;

              return (
                <div
                  key={loc.id}
                  className="d-flex justify-content-between align-items-center border rounded p-2 mb-2 bg-white shadow-sm"
                >
                  <div>
                    <div className="fw-semibold">{loc.title}</div>
                    <div className="text-muted small">{addr || "—"}</div>
                  </div>

                  <div className="d-flex align-items-center gap-3">
                    <span className="text-warning">
                      ★ {typeof loc.reviewsAvg === "number" ? loc.reviewsAvg.toFixed(1) : "—"}
                    </span>
                    <span className="text-muted small">({loc.reviewsCount ?? 0})</span>

                    <span className={`badge ${connected ? "bg-success" : "bg-secondary"}`}>
                      {connected ? "Conectado" : "No conectado"}
                    </span>

                    {/* Botón Sync (reutilizable) */}
                    <SyncNowButton locationId={loc.id} onAfterSuccess={loadLocations} />

                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => alert(`Conectar ${loc.title}`)}
                    >
                      Conectar
                    </button>
                  </div>
                </div>
              );
            })

          ))}
        </div>
      )}
    </div>
  );
}
