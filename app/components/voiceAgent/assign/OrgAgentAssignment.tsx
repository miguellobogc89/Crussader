"use client";

import React, { useState } from "react";
import CompanyListPanel from "@/app/components/voiceAgent/assign/CompanyListPanel";
import AgentsListPanel from "@/app/components/voiceAgent/assign/AgentsListPanel";

export default function OrgAgentAssignment({ defaultCompanyId }: { defaultCompanyId?: string }) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | undefined>(defaultCompanyId);
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(undefined);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
      {/* IZQ: Empresas */}
      <CompanyListPanel
        className="md:col-span-3"
        selectedCompanyId={selectedCompanyId}
        onSelect={(id) => {
          setSelectedCompanyId(id);
          setSelectedAgentId(undefined); // resetea selección de agente al cambiar de empresa
        }}
      />

      {/* CENTRO: Agentes de la empresa */}
      <AgentsListPanel
        className="md:col-span-5"
        companyId={selectedCompanyId}
        selectedAgentId={selectedAgentId}
        onSelect={setSelectedAgentId}
      />

      {/* DCHA: (próximo paso) Ubicaciones del agente seleccionado */}
    </div>
  );
}
