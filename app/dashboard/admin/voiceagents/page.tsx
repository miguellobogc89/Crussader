// app/dashboard/admin/voiceagents/page.tsx
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
} from "./actions/agents.actions";
import { listStages, saveFlowForAgent, type Stage } from "./actions/flow.actions";
import { getVoiceAgentIdByAgent } from "./actions/agents.helpers";
import ChatConfigurationShell from "@/app/components/voiceAgent/ChatConfigurationShell";
import { loadCompanyMeta } from "./actions/actions"; // ✅ archivo exacto

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

// ---- TIPADO para el import dinámico ----
type AssignAgentsPanelProps = { defaultCompanyId?: string };

// Carga perezosa del panel de Asignación, con tipado de props + .then(m => m.default)
const AssignAgentsPanel = dynamic<AssignAgentsPanelProps>(
  () =>
    import("@/app/components/voiceAgent/AssignAgentsPanel").then(
      (m) => m.default
    ),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">Cargando panel de asignación…</p>
      </div>
    ),
  }
);

type Phase = "INTRO" | "INTENT" | "COLLECT" | "CONFIRM" | "END";

const MENU: Array<{ key: "constructor" | "tel" | "assign" | "monitor"; name: string; href: string }> = [
  { key: "constructor", name: "Constructor", href: "/dashboard/admin/voiceagents" },
  { key: "tel",         name: "Telefonía",   href: "/dashboard/admin/voiceagents?tab=tel" },
  { key: "assign",      name: "Asignación",  href: "/dashboard/admin/voiceagents?tab=assign" },
  { key: "monitor",     name: "Monitorización", href: "/dashboard/admin/voiceagents?tab=monitor" },
];

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

  // Routing para tabs
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") ?? "constructor") as "constructor" | "tel" | "assign" | "monitor";

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
        {/* ===== Menú superior simple ===== */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Constructor Agentes IA
            </h1>
            <div className="text-sm text-muted-foreground">
              Empresa: <span className="font-medium">{companyName}</span>
            </div>
          </div>

          <nav className="mt-2 flex gap-4 border-b border-slate-200">
            {MENU.map((m) => {
              const current = m.key === tab;
              return (
                <Link
                  key={m.name}
                  href={m.href}
                  className={[
                    "inline-flex items-center gap-2 py-2 text-sm",
                    current
                      ? "font-medium text-slate-900 border-b-2 border-slate-900"
                      : "text-slate-500 hover:text-slate-900",
                  ].join(" ")}
                >
                  {m.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* ===== Contenido por pestañas ===== */}
        {tab === "constructor" && (
          <div className="mx-auto max-w-[1400px] space-y-6">
            {/* 1) Constructor del flow */}
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
                  xs.map((a) =>
                    a.id === id ? { ...a, name, updatedAt: new Date().toISOString() } : a
                  )
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

            {/* 2) Preview rápido */}
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
        )}

        {tab === "tel" && (
          <div className="rounded-2xl border bg-card p-4 shadow-sm space-y-4">
            <h2 className="text-lg font-medium">Telefonía</h2>
            <p className="text-sm text-muted-foreground">
              Configura números, proveedores y rutas de llamadas. (placeholder)
            </p>
          </div>
        )}

        {tab === "assign" && (
          <AssignAgentsPanel defaultCompanyId={companyId} />
        )}

        {tab === "monitor" && (
          <div className="rounded-2xl border bg-card p-4 shadow-sm space-y-4">
            <h2 className="text-lg font-medium">Monitorización</h2>
            <p className="text-sm text-muted-foreground">
              Logs, métricas y calidad de conversaciones. (placeholder)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
