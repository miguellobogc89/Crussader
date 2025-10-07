// app/components/voiceAgent/constructor/TabPageConstructor.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import FlowBuilderShell from "@/app/components/voiceAgent/constructor/FlowBuilderShell";
import ChatConfigurationShell from "@/app/components/voiceAgent/constructor/ChatConfigurationShell";

import {
  listAllAgentsAdmin,
  createVoiceAgent,
  duplicateVoiceAgent,
  deleteVoiceAgent,
  renameVoiceAgent,
  toggleVoiceAgent,
  type AdminAgentListItem as DbAgentListItem,
} from "@/app/dashboard/admin/voiceagents/actions/agents.actions";

import {
  listStages,
  saveFlowForAgent,
  type Stage,
} from "@/app/dashboard/admin/voiceagents/actions/flow.actions";

import { getVoiceAgentIdByAgent } from "@/app/dashboard/admin/voiceagents/actions/agents.helpers";
import { loadCompanyMeta } from "@/app/dashboard/admin/voiceagents/actions/actions";

// ⬇️ Importa los ajustes globales (compartidos en vivo)
import {
  DEFAULT_AGENT_GENERAL_SETTINGS,
  type AgentGeneralSettings,
} from "@/app/components/voiceAgent/constructor/AgentGeneralSettingsPanel";

type Phase = "INTRO" | "INTENT" | "COLLECT" | "CONFIRM" | "END";

export default function TabPageConstructor({
  defaultCompanyId,
}: {
  defaultCompanyId: string;
}) {
  // Empresa (header / contexto)
  const [companyId] = useState<string>(defaultCompanyId);
  const [companyName, setCompanyName] = useState<string>("—");

  // Agentes (ADMIN: todos)
  const [agents, setAgents] = useState<DbAgentListItem[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(undefined);
  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  // Flujo del agente
  const [stages, setStages] = useState<Stage[]>([]);
  const [loadingStages, setLoadingStages] = useState(false);

  // 🔗 Ajustes globales del agente — compartidos entre constructor y chat (sin persistir)
  const [generalSettings, setGeneralSettings] = useState<AgentGeneralSettings>(
    DEFAULT_AGENT_GENERAL_SETTINGS
  );

  // Cargar meta empresa (sólo para el bloque de preview)
  useEffect(() => {
    (async () => {
      const meta = await loadCompanyMeta(companyId);
      setCompanyName(meta?.name || "—");
    })();
  }, [companyId]);

  // Cargar TODOS los agentes (admin)
  useEffect(() => {
    (async () => {
      const list = await listAllAgentsAdmin();
      setAgents(list);
      setSelectedAgentId((prev) => prev ?? list[0]?.id ?? undefined);
    })();
  }, []);

  // Cargar stages del agente seleccionado
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

  // Ordenar stages por order
  const orderedStages = useMemo(
    () => [...stages].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [stages]
  );

  // Prompts por fase (para el chat)
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
      {/* Shell principal del constructor */}
      <FlowBuilderShell
        // Sidebar (admin)
        agents={agents as any}
        selectedAgentId={selectedAgentId}
        onSelectAgent={(id) => setSelectedAgentId(id)}
        onCreateAgent={async () => {
          const created = await createVoiceAgent(companyId);
          setAgents((xs) => [created as any, ...xs]);
          setSelectedAgentId(created.id);
        }}
        onDuplicateAgent={async (id) => {
          const dup = await duplicateVoiceAgent(id);
          setAgents((xs) => [dup as any, ...xs]);
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
            xs.map((a) =>
              a.id === id ? { ...a, isActive: next, updatedAt: new Date().toISOString() } : a
            )
          );
        }}
        // Flow
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
        // ⬇️ Ajustes globales controlados (compartidos con el Chat)
        generalSettings={generalSettings}
        onGeneralSettingsChange={setGeneralSettings}
      />

      {/* Preview / pruebas en tiempo real (usa los mismos ajustes) */}
      <div className="mt-2">
        <ChatConfigurationShell
          companyId={companyId}
          companyName={companyName}
          agentName={selectedAgent?.name}
          promptsByPhase={promptsByPhase}
          firstPromptFallback={firstPromptFallback}
          // ⬇️ Aquí viajan los ajustes (sin persistir)
          generalSettings={generalSettings}
        />
      </div>
    </div>
  );
}
