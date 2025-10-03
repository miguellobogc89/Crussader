"use client";

import React, { useEffect, useMemo, useState } from "react";
import FlowBuilderShell from "@/app/components/voiceAgent/FlowBuilderShell";
import ChatConfigurationShell from "@/app/components/voiceAgent/ChatConfigurationShell";

import {
  listVoiceAgents,
  createVoiceAgent,
  duplicateVoiceAgent,
  deleteVoiceAgent,
  renameVoiceAgent,
  toggleVoiceAgent,
  type AgentListItem as DbAgentListItem,
} from "@/app/dashboard/admin/voiceagents/actions/agents.actions";

import { listStages, saveFlowForAgent, type Stage } from "@/app/dashboard/admin/voiceagents/actions/flow.actions";
import { getVoiceAgentIdByAgent } from "@/app/dashboard/admin/voiceagents/actions/agents.helpers";
import { loadCompanyMeta } from "@/app/dashboard/admin/voiceagents/actions/actions";

type Phase = "INTRO" | "INTENT" | "COLLECT" | "CONFIRM" | "END";

export default function ConstructorTab({ defaultCompanyId }: { defaultCompanyId: string }) {
  // Empresa
  const [companyId] = useState<string>(defaultCompanyId);
  const [companyName, setCompanyName] = useState<string>("—");

  // Agentes
  const [agents, setAgents] = useState<DbAgentListItem[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(undefined);
  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  // Flujo del agente
  const [stages, setStages] = useState<Stage[]>([]);
  const [loadingStages, setLoadingStages] = useState(false);

  // Cargar meta empresa
  useEffect(() => {
    (async () => {
      const meta = await loadCompanyMeta(companyId);
      setCompanyName(meta?.name || "—");
    })();
  }, [companyId]);

  // Cargar agentes
  useEffect(() => {
    (async () => {
      const list = await listVoiceAgents(companyId);
      setAgents(list);
      setSelectedAgentId(list[0]?.id ?? undefined);
    })();
  }, [companyId]);

  // Cargar fases al cambiar de agente
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingStages(true);
      try {
        if (!selectedAgentId) {
          if (alive) setStages([]);
          return;
        }
        const voiceAgentId = await getVoiceAgentIdByAgent(selectedAgentId);
        if (!voiceAgentId) {
          if (alive) setStages([]);
          return;
        }
        const flow = await listStages(voiceAgentId);
        if (alive) setStages(flow ?? []);
      } finally {
        if (alive) setLoadingStages(false);
      }
    })();
    return () => { alive = false; };
  }, [selectedAgentId]);

  // Ordenar stages
  const orderedStages = useMemo(
    () => [...stages].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [stages]
  );

  // Prompts por fase para el banner
  const promptsByPhase = useMemo(() => {
    const pick = (t: Phase) => orderedStages.find((s) => s.type === t)?.prompt?.trim();
    const firstNonIntro = orderedStages.find((s) => s.type !== "INTRO")?.prompt?.trim();
    return {
      INTRO: pick("INTRO"),
      INTENT: pick("INTENT") ?? firstNonIntro,
      COLLECT: pick("COLLECT"),
      CONFIRM: pick("CONFIRM"),
      END: pick("END"),
    } as Record<Phase, string | undefined>;
  }, [orderedStages]);

  const firstPromptFallback = useMemo(
    () =>
      orderedStages[0]?.prompt?.trim() ??
      orderedStages.find((s) => s.prompt?.trim())?.prompt?.trim(),
    [orderedStages]
  );

  return (
    <div className="space-y-6">
      {/* Constructor del flow (sin panel de fases a la derecha) */}
      <FlowBuilderShell
        agents={agents as any}
        selectedAgentId={selectedAgentId}
        onSelectAgent={(id) => setSelectedAgentId(id)}
        onCreateAgent={async () => {
          const created = await createVoiceAgent(companyId);
          setAgents((xs) => [created, ...xs]);
          setSelectedAgentId(created.id);
        }}
        onDuplicateAgent={async (id) => {
          const dup = await duplicateVoiceAgent(id);
          setAgents((xs) => [dup, ...xs]);
          setSelectedAgentId(dup.id);
        }}
        onDeleteAgent={async (id) => {
          await deleteVoiceAgent(id);
          setAgents((prev) => {
            const next = prev.filter((a) => a.id !== id);
            if (selectedAgentId === id) setSelectedAgentId(next[0]?.id ?? undefined);
            return next;
          });
        }}
        onRenameAgent={async (id, name) => {
          await renameVoiceAgent(id, name);
          setAgents((xs) =>
            xs.map((a) => (a.id === id ? { ...a, name, updatedAt: new Date().toISOString() } : a))
          );
        }}
        onToggleActive={async (id, next) => {
          await toggleVoiceAgent(id, next);
          setAgents((xs) =>
            xs.map((a) => (a.id === id ? { ...a, isActive: next, updatedAt: new Date().toISOString() } : a))
          );
        }}
        stages={orderedStages}
        setStages={(flow) => setStages(flow)}
        onSaveStages={async (flow) => {
          if (!selectedAgentId) return;
          const voiceAgentId = await getVoiceAgentIdByAgent(selectedAgentId);
          if (!voiceAgentId) return;
          await saveFlowForAgent(voiceAgentId, flow);
        }}
        agentName={selectedAgent?.name}
        loadingStages={loadingStages}
      />

      {/* Preview rápido */}
      <div className="mt-2">
        <ChatConfigurationShell
          companyId={companyId}
          companyName={companyName}
          agentName={selectedAgent?.name}
          promptsByPhase={promptsByPhase}
          firstPromptFallback={firstPromptFallback}
        />
      </div>
    </div>
  );
}
