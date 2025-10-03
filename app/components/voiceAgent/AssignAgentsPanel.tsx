"use client";

import React, { useEffect, useMemo, useState, useTransition } from "react";
import {
  listAssignableCompanies,
  listAllVoiceAgentsForAssignment,
  setCompanyVoiceAgent,
  getCompanyCalendarSummary,
} from "@/app/dashboard/admin/voiceagents/actions/actions";

// ===== Tipos locales =====
type CompanyRow = {
  id: string;
  name: string;
  locationsCount: number;
  assignedVoiceAgentId: string | null;
  assignedVoiceAgentName: string | null;
};

type VoiceAgentRow = {
  voiceAgentId: string;
  agentId: string;
  name: string;
  status: "ACTIVE" | "PAUSED" | "DISABLED";
  channel: "VOICE" | "CHAT";
  companiesCount: number;
};

// ===== Util: debounce simple =====
function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ====== Componente ======
export default function AssignAgentsPanel({ defaultCompanyId }: { defaultCompanyId?: string }) {
  // Búsqueda
  const [q, setQ] = useState("");
  const qDebounced = useDebounced(q, 350);

  // Datos
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [agents, setAgents] = useState<VoiceAgentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Selección
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | undefined>(defaultCompanyId);
  const selectedCompany = useMemo(
    () => companies.find((c) => c.id === selectedCompanyId),
    [companies, selectedCompanyId]
  );

  // Resumen calendario
  const [calSummary, setCalSummary] = useState<{ locationsCount: number; servicesCount: number } | null>(null);

  // Estados de acción
  const [isPending, startTransition] = useTransition();
  const [busyAssign, setBusyAssign] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // ===== Carga principal =====
  async function loadAll() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [cs, vs] = await Promise.all([
        listAssignableCompanies(qDebounced),
        listAllVoiceAgentsForAssignment(),
      ]);
      setCompanies(cs);
      // Solo VOICE aquí
      setAgents(vs.filter((a) => a.channel === "VOICE"));
      if (!selectedCompanyId && cs.length) setSelectedCompanyId(cs[0].id);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Error cargando datos");
    } finally {
      setLoading(false);
    }
  }

  async function loadCalendarSummary(companyId?: string) {
    if (!companyId) {
      setCalSummary(null);
      return;
    }
    try {
      const s = await getCompanyCalendarSummary(companyId);
      setCalSummary(s);
    } catch {
      setCalSummary(null);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qDebounced]);

  useEffect(() => {
    loadCalendarSummary(selectedCompanyId);
  }, [selectedCompanyId]);

  // ===== Actions =====
  function showBanner(type: "success" | "error", msg: string, ms = 2200) {
    setBanner({ type, msg });
    setTimeout(() => setBanner(null), ms);
  }

  async function handleAssign(vaId: string) {
    if (!selectedCompanyId) return;
    setBusyAssign(vaId);

    // Optimista: reflejamos en UI antes de la respuesta
    const prevCompanies = companies;
    const nextCompanies = companies.map((c) =>
      c.id === selectedCompanyId
        ? { ...c, assignedVoiceAgentId: vaId, assignedVoiceAgentName: agents.find((a) => a.voiceAgentId === vaId)?.name ?? null }
        : c
    );
    setCompanies(nextCompanies);

    try {
      await setCompanyVoiceAgent(selectedCompanyId, vaId);
      showBanner("success", "Agente asignado");
      // Revalida datos
      startTransition(loadAll);
    } catch (e: any) {
      setCompanies(prevCompanies);
      showBanner("error", e?.message ?? "No se pudo asignar");
    } finally {
      setBusyAssign(null);
    }
  }

  async function handleUnassign() {
    if (!selectedCompanyId) return;
    setBusyAssign("unassign");

    const prevCompanies = companies;
    const nextCompanies = companies.map((c) =>
      c.id === selectedCompanyId ? { ...c, assignedVoiceAgentId: null, assignedVoiceAgentName: null } : c
    );
    setCompanies(nextCompanies);

    try {
      await setCompanyVoiceAgent(selectedCompanyId, null);
      showBanner("success", "Agente desasignado");
      startTransition(loadAll);
    } catch (e: any) {
      setCompanies(prevCompanies);
      showBanner("error", e?.message ?? "No se pudo desasignar");
    } finally {
      setBusyAssign(null);
    }
  }

  // ===== UI helpers =====
  const AssignedBadge = ({ text }: { text: string }) => (
    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
      {text}
    </span>
  );

  const StatusBadge = ({ s }: { s: VoiceAgentRow["status"] }) => {
    const map: Record<VoiceAgentRow["status"], string> = {
      ACTIVE: "bg-emerald-100 text-emerald-700",
      PAUSED: "bg-amber-100 text-amber-700",
      DISABLED: "bg-rose-100 text-rose-700",
    };
    const label: Record<VoiceAgentRow["status"], string> = {
      ACTIVE: "Activo",
      PAUSED: "Pausado",
      DISABLED: "Deshabilitado",
    };
    return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${map[s]}`}>{label[s]}</span>;
  };

  // ===== Render =====
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
      {/* Izquierda: Empresas */}
      <section className="md:col-span-4 space-y-3">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-900">Empresas</h3>
            <span className="text-xs text-slate-500">{loading ? "…" : companies.length} resultados</span>
          </div>

          <div className="mt-3">
            <div className="relative">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar empresa…"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-slate-200"
              />
              {q && (
                <button
                  onClick={() => setQ("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-800"
                >
                  limpiar
                </button>
              )}
            </div>
          </div>

          <div className="mt-3 max-h-[60vh] overflow-auto pr-1">
            {loading && (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-xl border border-slate-200 p-3">
                    <div className="h-3 w-1/2 rounded bg-slate-200" />
                    <div className="mt-2 h-2 w-1/3 rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            )}

            {!loading && companies.length === 0 && (
              <div className="py-6 text-center text-sm text-slate-500">Sin resultados.</div>
            )}

            {!loading &&
              companies.map((c) => {
                const isActive = c.id === selectedCompanyId;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCompanyId(c.id)}
                    className={[
                      "group mt-2 w-full rounded-xl border p-3 text-left transition",
                      isActive
                        ? "border-slate-900 bg-slate-900/90 text-white shadow-sm"
                        : "border-slate-200 bg-white hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">{c.name}</div>
                      <div className="text-xs opacity-80">#{c.locationsCount} ubic.</div>
                    </div>
                    <div className={isActive ? "text-xs opacity-80" : "text-xs text-slate-500"}>
                      {c.assignedVoiceAgentId ? (
                        <span className={isActive ? "" : ""}>
                          Asignado a <span className={isActive ? "font-medium" : "text-slate-700 font-medium"}>{c.assignedVoiceAgentName}</span>
                        </span>
                      ) : (
                        <span className={isActive ? "" : ""}>Sin agente</span>
                      )}
                    </div>
                  </button>
                );
              })}
          </div>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {errorMsg}
          </div>
        )}
      </section>

      {/* Derecha: Detalle + agentes */}
      <section className="md:col-span-8 space-y-4">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold">
                {selectedCompany ? selectedCompany.name : "Seleccione una empresa"}
              </h3>
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                <span>Ubicaciones: <span className="font-medium text-slate-700">{calSummary?.locationsCount ?? 0}</span></span>
                <span>•</span>
                <span>Servicios: <span className="font-medium text-slate-700">{calSummary?.servicesCount ?? 0}</span></span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedCompany?.assignedVoiceAgentId ? (
                <>
                  <AssignedBadge text={`Asignado: ${selectedCompany.assignedVoiceAgentName ?? "—"}`} />
                  <button
                    onClick={handleUnassign}
                    disabled={isPending || busyAssign === "unassign"}
                    className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {busyAssign === "unassign" ? "Desasignando…" : "Desasignar"}
                  </button>
                </>
              ) : (
                <span className="text-xs text-slate-500">Sin agente asignado</span>
              )}
            </div>
          </div>
        </div>

        {/* Grid de agentes */}
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-medium">Agentes de voz disponibles</h4>
            <span className="text-xs text-slate-500">{agents.length} agentes</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl border border-slate-200 p-4">
                  <div className="h-4 w-2/3 rounded bg-slate-200" />
                  <div className="mt-2 h-3 w-1/3 rounded bg-slate-100" />
                  <div className="mt-4 h-8 w-full rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : agents.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">No hay agentes de voz.</div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {agents.map((a) => {
                const isAssigned = selectedCompany?.assignedVoiceAgentId === a.voiceAgentId;
                const canAssign = a.status !== "DISABLED" && !isAssigned && !!selectedCompanyId;
                const assigningThis = busyAssign === a.voiceAgentId;

                return (
                  <div key={a.voiceAgentId} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-slate-900">{a.name}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {a.companiesCount} compañías
                        </div>
                      </div>
                      <StatusBadge s={a.status} />
                    </div>

                    <div className="mt-4">
                      {isAssigned ? (
                        <button
                          disabled
                          className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white"
                        >
                          ✓ Asignado
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAssign(a.voiceAgentId)}
                          disabled={!canAssign || assigningThis || isPending}
                          className={[
                            "inline-flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm font-medium",
                            canAssign
                              ? "bg-slate-900 text-white hover:bg-black"
                              : "bg-slate-200 text-slate-500",
                          ].join(" ")}
                        >
                          {assigningThis ? "Asignando…" : "Asignar a esta empresa"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {banner && (
          <div
            className={[
              "rounded-xl px-3 py-2 text-sm",
              banner.type === "success"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border border-rose-200 bg-rose-50 text-rose-700",
            ].join(" ")}
          >
            {banner.msg}
          </div>
        )}
      </section>
    </div>
  );
}
