
//app/components/voiceAgent/Constructor/FlowBuilderShell.tsx
"use client";

import React from "react";
import AgentsSidebar, {
  type AgentListItem as SidebarAgentListItem, // 👈 usa el tipo real del sidebar
} from "@/app/components/voiceAgent/constructor/AgentsSidebar";
import FlowEditor, { type FlowStage } from "@/app/components/voiceAgent/constructor/FlowEditor";
import PhaseList from "@/app/components/voiceAgent/constructor/PhaseList";

export default function FlowBuilderShell({
  agents,
  selectedAgentId,
  onSelectAgent,
  onCreateAgent,
  onDuplicateAgent,
  onDeleteAgent,
  onRenameAgent,
  onToggleActive,
  stages,
  setStages,
  onSaveStages,
  agentName,
  loadingStages,
}: {
  // 👇 acepta un array “parecido” y dentro lo normalizamos
  agents: Array<SidebarAgentListItem & { isActive?: boolean }>;
  selectedAgentId?: string;
  onSelectAgent: (id: string) => void;
  onCreateAgent: () => Promise<void>;
  onDuplicateAgent: (id: string) => Promise<void>;
  onDeleteAgent: (id: string) => Promise<void>;
  onRenameAgent: (id: string, name: string) => Promise<void>;
  onToggleActive: (id: string, next: boolean) => Promise<void>;
  stages: FlowStage[];
  setStages: (flow: FlowStage[]) => void;
  onSaveStages: (flow: FlowStage[]) => Promise<void>;
  agentName?: string;
  loadingStages?: boolean;
}) {
  // 🔧 Normaliza isActive a boolean estricto
  const sidebarAgents: SidebarAgentListItem[] = agents.map((a) => ({
    ...a,
    isActive: !!a.isActive,
  }));

  return (
    <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-[320px_1fr_320px]">
      <div className="min-h-[560px]">
        <AgentsSidebar
          agents={sidebarAgents}                   
          selectedId={selectedAgentId}
          onSelect={onSelectAgent}
          onCreate={onCreateAgent}
          onDuplicate={onDuplicateAgent}
          onDelete={onDeleteAgent}
          onRename={onRenameAgent}
          onToggleActive={onToggleActive}
        />
      </div>

      <div className="min-h-[560px]">
        <FlowEditor
          key={selectedAgentId || "no-agent"}
          initialFlow={stages}
          onChange={setStages}
          onSave={onSaveStages}
          agentName={agentName}
          loading={!!loadingStages}
        />
      </div>

      <div className="min-h-[560px]">
        <PhaseList onSelect={(_tpl) => { /* pendiente: insertar plantilla */ }} />
      </div>
    </div>
  );
}
