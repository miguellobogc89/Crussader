"use client";

import React, { useEffect, useMemo, useState } from "react";
import { listAssignableCompanies } from "@/app/dashboard/admin/voiceagents/actions/actions";

// Tipado local acorde a la server action corregida
type CompanyRow = {
  id: string;
  name: string;
  locationsCount: number;
  assignedVoiceAgentId: string | null;
  assignedVoiceAgentName: string | null;
  assignedVoiceAgentExternal: boolean;
  ownedVoiceAgentsCount: number;
};

function useDebounced<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function CompanyListPanel({
  selectedCompanyId,
  onSelect,
  className,
  autoSelectFirst = true,
}: {
  selectedCompanyId?: string;
  onSelect: (companyId: string) => void;
  className?: string;
  autoSelectFirst?: boolean;
}) {
  const [query, setQuery] = useState("");
  const qDebounced = useDebounced(query, 350);

  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);

  async function loadCompanies() {
    setLoading(true);
    try {
      const cs = await listAssignableCompanies("");
      setCompanies(cs as CompanyRow[]);
      if (autoSelectFirst && !selectedCompanyId && cs.length) onSelect(cs[0].id);
    } finally {
      setLoading(false);
    }
  }

  async function searchCompanies() {
    setLoadingSearch(true);
    try {
      const cs = await listAssignableCompanies(qDebounced);
      setCompanies(cs as CompanyRow[]);
      if (autoSelectFirst && !selectedCompanyId && cs.length) onSelect(cs[0].id);
    } finally {
      setLoadingSearch(false);
    }
  }

  useEffect(() => {
    loadCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!loading) searchCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qDebounced]);

  const Spinner = () => (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-transparent" />
  );

  const HeaderRight = useMemo(() => {
    if (loading) return <span className="text-xs text-slate-400">cargando…</span>;
    if (loadingSearch) return <Spinner />;
    return <span className="text-xs text-slate-500">{companies.length} resultados</span>;
  }, [loading, loadingSearch, companies.length]);

  return (
    <section className={["space-y-3", className].filter(Boolean).join(" ")}>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-900">Empresas</h3>
          {HeaderRight}
        </div>

        <div className="mt-3">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar empresa…"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 pr-8 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-slate-200"
              aria-label="Buscar empresa"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Limpiar búsqueda"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 max-h-[60vh] overflow-auto pr-1">
          {(loading || loadingSearch) && companies.length === 0 ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl border border-slate-200 p-3">
                  <div className="h-3 w-1/2 rounded bg-slate-200" />
                  <div className="mt-2 h-2 w-1/3 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : companies.length === 0 ? (
            <div className="py-6 text-center text-sm text-slate-500">Sin resultados.</div>
          ) : (
            companies.map((c) => {
              const active = c.id === selectedCompanyId;
              return (
                <button
                  key={c.id}
                  onClick={() => onSelect(c.id)}
                  className={[
                    "group mt-2 w-full rounded-xl border p-3 text-left transition",
                    active ? "border-slate-300 bg-slate-100" : "border-slate-200 bg-white hover:bg-slate-50",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-slate-900">{c.name}</div>
                    <div className="text-xs text-slate-500">#{c.locationsCount} ubic.</div>
                  </div>

                  <div className="text-xs text-slate-500">
                    {c.assignedVoiceAgentId ? (
                      <>
                        Asignado a{" "}
                        <span className="font-medium text-slate-700">
                          {c.assignedVoiceAgentName ?? "—"}
                        </span>
                        {c.assignedVoiceAgentExternal ? " (externo)" : null}
                      </>
                    ) : c.ownedVoiceAgentsCount > 0 ? (
                      <>
                        {c.ownedVoiceAgentsCount} agente
                        {c.ownedVoiceAgentsCount === 1 ? "" : "s"}
                      </>
                    ) : (
                      "Sin agentes"
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
