"use client";

import React, { useCallback, useMemo, useState } from "react";
import CompanyListPanel from "@/app/components/voiceAgent/assign/CompanyListPanel";
import AgentsListPanel from "@/app/components/voiceAgent/assign/AgentsListPanel";
import {
  assignVoiceAgentToLocations,
  unassignVoiceAgentFromLocations,
  loadCompanyMeta,
} from "@/app/dashboard/admin/voiceagents/actions/actions";

export default function TabPageAssign({
  defaultCompanyId,
}: {
  defaultCompanyId?: string;
}) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | undefined>(
    defaultCompanyId
  );
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(
    undefined
  );

  const [reloadKeyCompanies, setReloadKeyCompanies] = useState(0);
  const [reloadKeyAgents, setReloadKeyAgents] = useState(0);

  const [busy, setBusy] = useState<null | "assign" | "unassign">(null);
  const [error, setError] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("");

  const ensureCompanyName = useCallback(async () => {
    if (!selectedCompanyId) return;
    const meta = await loadCompanyMeta(selectedCompanyId);
    setCompanyName(meta?.name ?? "");
  }, [selectedCompanyId]);

  const canAssign = !!selectedCompanyId && !!selectedAgentId && busy === null;
  const canUnassign = !!selectedCompanyId && busy === null;

  const Subtitle = useMemo(() => {
    if (!selectedCompanyId && !selectedAgentId)
      return "Selecciona una empresa y un agente para asignarlos.";
    if (selectedCompanyId && !selectedAgentId)
      return "Selecciona un agente de la empresa para asignarlo.";
    if (!selectedCompanyId && selectedAgentId)
      return "Selecciona primero una empresa.";
    return "Listo para asignar o desasignar.";
  }, [selectedCompanyId, selectedAgentId]);

  async function handleAssign() {
    if (!selectedCompanyId || !selectedAgentId || busy) return;
    setBusy("assign");
    setError(null);
    try {
      await ensureCompanyName();
      // por ahora pasamos array vacío -> significa “todas las sedes”
      await assignVoiceAgentToLocations(selectedCompanyId, []);
      setReloadKeyCompanies((k) => k + 1);
      setReloadKeyAgents((k) => k + 1);
    } catch (e: any) {
      setError(e?.message ?? "No se pudo asignar el agente.");
    } finally {
      setBusy(null);
    }
  }

  async function handleUnassign() {
    if (!selectedCompanyId || busy) return;
    setBusy("unassign");
    setError(null);
    try {
      await ensureCompanyName();
      await unassignVoiceAgentFromLocations(selectedCompanyId, []);
      setReloadKeyCompanies((k) => k + 1);
      setReloadKeyAgents((k) => k + 1);
    } catch (e: any) {
      setError(e?.message ?? "No se pudo desasignar el agente.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
      <div className="md:col-span-3">
        <CompanyListPanel
          key={`companies_${reloadKeyCompanies}`}
          selectedCompanyId={selectedCompanyId}
          onSelect={(id) => {
            setSelectedCompanyId(id);
            setSelectedAgentId(undefined);
          }}
        />
      </div>

      <div className="md:col-span-5">
        <AgentsListPanel
          key={`agents_${selectedCompanyId ?? "none"}_${reloadKeyAgents}`}
          companyId={selectedCompanyId}
          selectedAgentId={selectedAgentId}
          onSelect={setSelectedAgentId}
        />
      </div>

      <section className="md:col-span-4 space-y-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-medium text-slate-900">Asignación</h3>
          <p className="mt-1 text-xs text-slate-500">{Subtitle}</p>

          {error && (
            <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
              {error}
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 gap-3">
            <button
              onClick={handleAssign}
              disabled={!canAssign}
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-50"
            >
              {busy === "assign" ? "Asignando…" : "Asignar agente a la empresa"}
            </button>

            <button
              onClick={handleUnassign}
              disabled={!canUnassign || !selectedCompanyId}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {busy === "unassign" ? "Desasignando…" : "Quitar agente de la empresa"}
            </button>
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <div>
              Empresa seleccionada:{" "}
              <span className="font-medium">
                {companyName || selectedCompanyId || "—"}
              </span>
            </div>
            <div>
              Agente seleccionado:{" "}
              <span className="font-mono">{selectedAgentId || "—"}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
