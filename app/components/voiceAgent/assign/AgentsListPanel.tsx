"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  listCompanyVoiceAgents,
  createVoiceAgentForCompany,
} from "@/app/dashboard/admin/voiceagents/actions/actions";

type AgentRow = Awaited<ReturnType<typeof listCompanyVoiceAgents>>[number];

function useDebounced<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function AgentsListPanel({
  companyId,
  selectedAgentId,
  onSelect,
  className,
}: {
  companyId?: string;
  selectedAgentId?: string;
  onSelect: (voiceAgentId: string) => void;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const qDeb = useDebounced(query, 300);

  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [busy, setBusy] = useState<null | "create">(null);
  const [error, setError] = useState<string | null>(null);

  const Spinner = () => (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-transparent" />
  );

  async function fetchAgents() {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const list = await listCompanyVoiceAgents(companyId);
      setAgents(list);
      // si no hay selección aún, selecciona el primero
      if (!selectedAgentId && list.length > 0) onSelect(list[0].voiceAgentId);
    } catch (e: any) {
      setError(e?.message ?? "No se pudo cargar la lista de agentes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (companyId) fetchAgents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  // Filtro client-side
  const filtered = useMemo(() => {
    const norm = (s: string) => (s || "").toLowerCase().normalize("NFKD");
    const q = norm(qDeb);
    if (!q) return agents;
    return agents.filter((a) => norm(a.name).includes(q));
  }, [agents, qDeb]);

  // feedback visual de “búsqueda”
  useEffect(() => {
    if (!loading) {
      setLoadingSearch(true);
      const t = setTimeout(() => setLoadingSearch(false), 200);
      return () => clearTimeout(t);
    }
  }, [qDeb, loading]);

  const statusLabel = (s: AgentRow["status"]) =>
    s === "ACTIVE" ? "Activo" : s === "PAUSED" ? "Pausado" : "Deshabilitado";

  const HeaderRight = useMemo(() => {
    if (!companyId) return <span className="text-xs text-slate-400">sin empresa</span>;
    if (loading) return <span className="text-xs text-slate-400">cargando…</span>;
    if (loadingSearch) return <Spinner />;
    return <span className="text-xs text-slate-500">{filtered.length} resultados</span>;
  }, [companyId, loading, loadingSearch, filtered.length]);

  async function handleCreate() {
    if (!companyId || busy) return;
    const name = prompt("Nombre para el nuevo agente:");
    if (!name || !name.trim()) return;
    setBusy("create");
    setError(null);
    try {
      const created = await createVoiceAgentForCompany({
        companyId,
        name: name.trim(),
        language: "es-ES",
      });
      await fetchAgents();
      if (created?.voiceAgentId) onSelect(created.voiceAgentId);
    } catch (e: any) {
      setError(e?.message ?? "No se pudo crear el agente.");
    } finally {
      setBusy(null);
    }
  }

  // formateo de fecha
  const fmtDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString("es-ES") : "—";

  return (
    <section className={["space-y-3", className].filter(Boolean).join(" ")}>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-900">Agentes de la empresa</h3>
          <div className="flex items-center gap-3">
            {HeaderRight}
            <button
              onClick={handleCreate}
              disabled={!companyId || !!busy}
              className="inline-flex items-center rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-black disabled:opacity-50"
            >
              {busy === "create" ? "Creando…" : "Nuevo agente"}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-3">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar agente…"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 pr-8 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-slate-200"
              aria-label="Buscar agente"
              disabled={loading || !companyId}
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

        {/* List — altura FIJA igual al panel izquierdo */}
        <div className="mt-3 h-[60vh] overflow-auto pr-1">
          {error && (
            <div className="mb-2 rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
              {error}
            </div>
          )}

          {(!companyId || loading) && (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl border border-slate-200 p-3">
                  <div className="h-4 w-2/3 rounded bg-slate-200" />
                  <div className="mt-2 h-3 w-1/3 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          )}

          {!loading && companyId && filtered.length === 0 && (
            <div className="py-8 text-center text-sm text-slate-500">
              No hay agentes. Crea el primero.
            </div>
          )}

          {!loading &&
            companyId &&
            filtered.map((a) => {
              const active = a.voiceAgentId === selectedAgentId;
              const externalTag =
                a.isAssignedDefault && a.isExternalAssigned ? (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    Asignado (externo)
                  </span>
                ) : a.isAssignedDefault ? (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    Asignado
                  </span>
                ) : null;

              return (
                <button
                  key={a.voiceAgentId}
                  onClick={() => onSelect(a.voiceAgentId)}
                  className={[
                    "mt-2 w-full rounded-xl border p-3 text-left transition",
                    active ? "border-slate-300 bg-slate-100" : "border-slate-200 bg-white hover:bg-slate-50",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium text-slate-900">{a.name}</div>
                    <div className="flex items-center gap-2">
                      {externalTag}
                      <div className="text-xs text-slate-600">{statusLabel(a.status)}</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    Creado: {fmtDate(a.createdAt)} • Fases: {a.phasesCount}
                  </div>
                </button>
              );
            })}
        </div>
      </div>
    </section>
  );
}
