// app/components/admin/integrations/whatsapp/WhatsappAdminPanel.tsx
"use client";

import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { SendHorizonal } from "lucide-react";

import ChatPanel from "@/app/components/admin/integrations/whatsapp/ChatPanel";
import CustomersListPanel from "@/app/components/admin/integrations/whatsapp/ContactsPanel/CustomersListPanel";
import ConversationHeader, {
  type ConversationContact,
} from "@/app/components/admin/integrations/whatsapp/ConversationHeader";
import ChatQuickActions from "@/app/components/admin/integrations/whatsapp/ChatQuickActions";
import type { TemplateGroupKey } from "@/lib/whatsapp/templateGroups";

export type WaDebugEvent =
  | { kind: "status"; at: number; status: string; id?: string; to?: string; ts?: string }
  | { kind: "message"; at: number; from: string; id?: string; type?: string; text?: string; ts?: string }
  | { kind: "out"; at: number; to: string; id?: string; text?: string; ts?: string; status?: string | null };

export type DefaultTemplate = {
  id: string;
  template_name: string;
  title: string;
  body_preview: string | null;
  language: string;
  category: string;
  use_type: string;
  status: string;
  is_favorite: boolean;
  updated_at: string;
};

function Toast({ text, onClose }: { text: string; onClose: () => void }) {
  return (
    <div className="pointer-events-auto flex items-center justify-between gap-2 rounded-full border bg-background/95 px-3 py-2 text-xs text-muted-foreground shadow-sm backdrop-blur">
      <span className="truncate">{text}</span>
      <button
        type="button"
        onClick={onClose}
        className="rounded-full px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted/60"
      >
        OK
      </button>
    </div>
  );
}

export default function WhatsappAdminPanel(props: {
  // Data
  companyId: string | null;

  tplDefaults: Record<string, DefaultTemplate | null>;
  selectedPhone: string;
  selectedContact: ConversationContact | null;
  selectedConversationId: string | null;

  chatEvents: WaDebugEvent[];
  chatLoading: boolean;

  body: string;
  sending: boolean;
  toast: string | null;

  // Actions
  setBody: (v: string) => void;
  setToast: (v: string | null) => void;

  onSelectPhone: (phone: string, meta?: { name?: string; avatarUrl?: string | null; conversationId?: string | null }) => void;

  onInsertTemplate: (groupKey: TemplateGroupKey, text: string) => void;
  onSend: () => void;

  // Layout: para el paso 2 añadiremos aquí el panel derecho vacío
  rightPanel?: React.ReactNode;
}) {
  const {
    companyId,
    tplDefaults,
    selectedPhone,
    selectedContact,
    selectedConversationId,
    chatEvents,
    chatLoading,
    body,
    sending,
    toast,
    setBody,
    setToast,
    onSelectPhone,
    onInsertTemplate,
    onSend,
    rightPanel,
  } = props;

return (
  <div className="h-[calc(100vh-180px)] min-h-[720px]">
    <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
      {/* Card principal (WhatsApp) */}
      <Card className="h-full overflow-hidden border-0 bg-transparent shadow-none">
        <CardContent className="h-full p-0">
          <div className="grid h-full grid-cols-1 lg:grid-cols-[360px_1fr]">
            {/* Left */}
            <CustomersListPanel
              loading={false}
              search={""}
              setSearch={() => {}}
              contacts={[]}
              customers={[]}
              customersLoadedOnce={false}
              selectedPhone={selectedPhone}
              onSelectPhone={onSelectPhone}
            />

            {/* Right */}
            <div className="flex h-full min-h-0 flex-col">
              <ConversationHeader contact={selectedContact} />

              <ChatQuickActions
                defaults={tplDefaults}
                disabled={!selectedContact || sending || chatLoading || !selectedConversationId}
                onInsertTemplate={onInsertTemplate}
              />

              <div className="relative flex-1 min-h-0">
                {chatLoading ? (
                  <div className="h-full w-full p-4 text-sm text-muted-foreground">
                    Cargando conversación...
                  </div>
                ) : (
                  <ChatPanel events={chatEvents} className="h-full" />
                )}

                <div className="pointer-events-none absolute bottom-4 left-0 right-0 flex justify-center px-4">
                  {toast ? <Toast text={toast} onClose={() => setToast(null)} /> : null}
                </div>
              </div>

              <div className="border-t bg-white px-4 py-3">
                <div className="flex items-center gap-3">
                  <Input
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (!sending) onSend();
                      }
                    }}
                    className="h-11 flex-1 rounded-xl border-0 bg-gray-100 px-4 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  />

                  <Button
                    onClick={onSend}
                    disabled={sending}
                    className="h-11 rounded-xl bg-emerald-500 px-5 text-white hover:bg-emerald-600 disabled:opacity-60"
                  >
                    <SendHorizonal className="mr-2 h-4 w-4" />
                    Enviar
                  </Button>
                </div>
              </div>
            </div>
            {/* /Right */}
          </div>
        </CardContent>
      </Card>

      {/* Card secundario (Pensamiento IA / Debug) */}
      <Card className="h-full overflow-hidden">
        <CardContent className="h-full p-4">
          {rightPanel ? rightPanel : <div className="text-sm text-muted-foreground">Pensamiento IA</div>}
        </CardContent>
      </Card>
    </div>
  </div>
);
}