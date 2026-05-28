// app/components/admin/crussaderAssistant/CrussaderAssistantShell.tsx
"use client";

import { useState } from "react";
import { useBootstrapStore } from "@/app/providers/bootstrap-store";
import CrussaderAssistantPanel from "@/app-legacy/components-legacy/crussaderAssistant/CrussaderAssistantPanel";
import { useCrussaderAssistantChatEvents } from "@/app-legacy/components-legacy/crussaderAssistant/hooks/useCrussaderAssistantChatEvents";

export type AssistantConversationContact = {
  name: string;
  phoneE164: string;
  avatarUrl?: string | null;
};

type SelectedThreadMeta = {
  conversationId: string | null;
  agentId: string | null;
  phoneNumberId: string | null;
  environment: "TEST" | "PROD";
};

export default function CrussaderAssistantShell() {
  const companyId = useBootstrapStore((s) => s.data?.activeCompanyResolved?.id ?? null);

  const [selectedPhone, setSelectedPhone] = useState("");
  const [selectedContact, setSelectedContact] = useState<AssistantConversationContact | null>(null);

  const [thread, setThread] = useState<SelectedThreadMeta>({
    conversationId: null,
    agentId: null,
    phoneNumberId: null,
    environment: "TEST",
  });

  const chatModel = useCrussaderAssistantChatEvents({
    companyId,
    conversationId: thread.conversationId,
    pollMs: 2000,
  });

  return (
    <CrussaderAssistantPanel
      companyId={companyId}
      selectedPhone={selectedPhone}
      selectedContact={selectedContact}
      selectedConversationId={thread.conversationId}
      chatEvents={chatModel.events}
      chatLoading={chatModel.loading}
      onSelectPhone={(
        phone,
        meta?: {
          name?: string;
          avatarUrl?: string | null;
          conversationId?: string | null;
          agentId?: string | null;
          phoneNumberId?: string | null;
          environment?: "TEST" | "PROD";
        }
      ) => {
        setSelectedPhone(phone);

        setSelectedContact({
          name: meta && meta.name ? meta.name : "Usuario",
          phoneE164: phone,
          avatarUrl: meta && "avatarUrl" in (meta ?? {}) ? meta?.avatarUrl ?? null : null,
        });

        setThread({
          conversationId: meta && meta.conversationId ? meta.conversationId : null,
          agentId: meta && meta.agentId ? meta.agentId : null,
          phoneNumberId: meta && meta.phoneNumberId ? meta.phoneNumberId : null,
          environment: meta && meta.environment ? meta.environment : "TEST",
        });
      }}
    />
  );
}