// /app/components/voiceAgent/AssignAgentsPanel.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  listAssignableCompanies,
  listAllVoiceAgentsForAssignment,
  setCompanyVoiceAgent,
  getCompanyCalendarSummary,
} from "@/app/dashboard/admin/voiceagents/actions/actions"; // ✅ ruta correcta al archivo

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

export default function AssignAgentsPanel({ defaultCompanyId }: { defaultCompanyId?: string }) {
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [agents, setAgents] = useState<VoiceAgentRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const [selectedCompanyId, setSelectedCompanyId] = useState<string | undefined>(defaultCompanyId);
  const selectedCompany = useMemo(
    () => companies.find((c) => c.id === selectedCompanyId),
    [companies, selectedCompanyId]
  );

  const [calSummary, setCalSummary] = useState<{ locationsCount: number; servicesCount: number } | null>(null);
  const [busyAssign, setBusyAssign] = useState<string | null>(null);

  async function loadAll() {
    setLoading(true);
    try {
      const [cs, vs] = await Promise.all([listAssignableCompanies(q), listAllVoiceAgentsForAssignment()]);
      setCompanies(cs);
      setAgents(vs.filter((a) => a.channel === "VOICE"));
      if (!selectedCompanyId && cs.length) setSelectedCompanyId(cs[0].id);
    } finally {
      setLoading(false);
    }
  }

  async function loadCalendarSummary(companyId?: string) {
    if (!companyId) {
      setCalSummary(null);
      return;
    }
    const s = await getCompanyCalendarSummary(companyId);
    setCalSummary(s);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    loadCalendarSummary(selectedCompanyId);
  }, [selectedCompanyId]);

  async function handleAssign(vaId: string) {
    if (!selectedCompanyId) return;
    setBusyAssign(vaId);
    try {
      await setCompanyVoiceAgent(selectedCompanyId, vaId);
      await loadAll();
    } finally {
      setBusyAssign(null);
    }
  }

  async function handleUnassign() {
    if (!selectedCompanyId) return;
    setBusyAssign("unassign");
    try {
      await setCompanyVoiceAgent(selectedCompanyId, null);
      await loadAll();
    } finally {
      setBusyAssign(null);
    }
  }

  return (
    <div>
      {/* TODO: aquí tu UI completa. Por ahora lo he dejado mínimo para validar el flujo sin errores. */}
      Panel de asignación
    </div>
  );
}
