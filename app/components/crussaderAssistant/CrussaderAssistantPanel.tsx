// app/components/crussaderAssistant/CrussaderAssistantPanel.tsx
"use client";

import { Card, CardContent } from "@/app/components/ui/card";
import ChatPanel from "@/app/components/crussaderAssistant/ChatPanel";
import CustomersListPanel from "@/app/components/crussaderAssistant/ContactsPanel/CustomersListPanel";
import ConversationHeader from "@/app/components/crussaderAssistant/ConversationHeader";
import type { AssistantChatEvent } from "@/app/components/crussaderAssistant/hooks/useCrussaderAssistantChatEvents";
import type { AssistantConversationContact } from "@/app/components/crussaderAssistant/CrussaderAssistantShell";

export default function CrussaderAssistantPanel(props: {
  companyId: string | null;
  selectedPhone: string;
  selectedContact: AssistantConversationContact | null;
  selectedConversationId: string | null;
  chatEvents: AssistantChatEvent[];
  chatLoading: boolean;
  onSelectPhone: (
    phone: string,
    meta?: {
      name?: string;
      avatarUrl?: string | null;
      conversationId?: string | null;
      agentId?: string | null;
      phoneNumberId?: string | null;
      environment?: "TEST" | "PROD";
    }
  ) => void;
}) {
  const {
    companyId,
    selectedPhone,
    selectedContact,
    chatEvents,
    chatLoading,
    onSelectPhone,
  } = props;

  return (
    <div className="h-[calc(100vh-180px)] min-h-[720px]">
      <Card className="h-full overflow-hidden border-0 bg-transparent shadow-none">
        <CardContent className="h-full p-0">
          <div className="grid h-full grid-cols-1 lg:grid-cols-[360px_1fr]">
            <CustomersListPanel
              companyId={companyId}
              selectedPhone={selectedPhone}
              onSelectPhone={onSelectPhone}
            />

            <div className="flex h-full min-h-0 flex-col">
              <ConversationHeader contact={selectedContact} />

              <div className="relative flex-1 min-h-0">
                {chatLoading ? (
                  <div className="h-full w-full p-4 text-sm text-muted-foreground">
                    Cargando conversación...
                  </div>
                ) : (
                  <ChatPanel events={chatEvents} className="h-full" />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}