"use client";

import React, { useEffect, useMemo, useState } from "react";
import FlowBuilderShell from "@/app/components/voiceAgent/FlowBuilderShell";
import {
  listVoiceAgents,
  createVoiceAgent,
  duplicateVoiceAgent,
  deleteVoiceAgent,
  renameVoiceAgent,
  toggleVoiceAgent,
  type AgentListItem as DbAgentListItem,
} from "./agents.actions";
import { listStages, saveFlowForAgent, type Stage } from "./flow.actions";
import { getVoiceAgentIdByAgent } from "./agents.helpers";
import ChatConfigurationShell from "@/app/components/voiceAgent/ChatConfigurationShell";
import { loadCompanyMeta } from "./actions";

type Phase = "INTRO" | "INTENT" | "COLLECT" | "CONFIRM" | "END";

export default function VoiceAgentConstructorPage() {
  // Agentes
  const [agents, setAgents] = useState<DbAgentListItem[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(undefined);
  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  // Empresa
  const [companyId] = useState<string>("cmfmxqxqx0000i5i4ph2bb3ij");
  const [companyName, setCompanyName] = useState<string>("—");

  // Flujo del agente
  const [stages, setStages] = useState<Stage[]>([]);
  const [loadingStages, setLoadingStages] = useState(false);

  // Cargar agentes
  useEffect(() => {
    (async () => {
      const list = await listVoiceAgents(companyId);
      setAgents(list);
      setSelectedAgentId(list[0]?.id ?? undefined);
    })();
  }, [companyId]);

  // Cargar nombre empresa
  useEffect(() => {
    (async () => {
      const meta = await loadCompanyMeta(companyId);
      setCompanyName(meta?.name || "—");
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
    return () => {
      alive = false;
    };
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
    <div className="min-h-[calc(100vh-2rem)] w-full bg-gradient-to-br from-slate-50 to-slate-100 p-4 text-slate-900 md:p-6">
      <div className="mx-auto max-w-[1400px] space-y-6">
        {/* 1) Primer shell: constructor del flow */}
        <FlowBuilderShell
          agents={agents as any} // el shell normaliza isActive internamente
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

        {/* 2) Banner de preview (segundo shell minimal) */}
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
    </div>
  );
}
