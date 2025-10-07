// app/components/voiceAgent/Constructor/FlowBuilderShell.tsx
"use client";

import React from "react";
import AgentsSidebar, {
  type AgentListItem as SidebarAgentListItem,
} from "@/app/components/voiceAgent/constructor/AgentsSidebar";
import FlowEditor, { type FlowStage } from "@/app/components/voiceAgent/constructor/FlowEditor";

// Nueva barra inferior desplegable (controlada)
import AgentGeneralSettingsDock, {
  type AgentGeneralSettings,
} from "@/app/components/voiceAgent/constructor/AgentGeneralSettingsDock";

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

  // Ajustes globales controlados desde el padre
  generalSettings,
  onGeneralSettingsChange,
}: {
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

  generalSettings: AgentGeneralSettings;
  onGeneralSettingsChange: (next: AgentGeneralSettings) => void;
}) {
  const sidebarAgents: SidebarAgentListItem[] = agents.map((a) => ({
    ...a,
    isActive: !!a.isActive,
  }));

  return (
    <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-[320px_1fr]">
      {/* Columna izquierda: agentes */}
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

      {/* Columna derecha: editor */}
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

      {/* Barra inferior (ocupa ancho de las dos columnas) */}
      <div className="md:col-span-2">
        <AgentGeneralSettingsDock
          settings={generalSettings}
          onChange={onGeneralSettingsChange}
        />
      </div>
    </div>
  );
}
