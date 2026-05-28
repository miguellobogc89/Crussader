// app/components/whatsapp/WhatsappAdminPanel.tsx
"use client";

import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { SendHorizonal } from "lucide-react";

import ChatPanel from "@/app/components/whatsapp/ChatPanel";
import CustomersListPanel from "@/app/components/whatsapp/ContactsPanel/CustomersListPanel";
import ConversationHeader, {
  type ConversationContact,
} from "@/app/components/whatsapp/ConversationHeader";
import ChatQuickActions from "@/app/components/whatsapp/ChatQuickActions";
import type { TemplateGroupKey } from "@/lib/whatsapp/templateGroups";

type NormalizedChatMessage = {
  id?: string | null;
  at?: number | string | Date | null;
  direction: "in" | "out";
  kind?: string;
  displayText?: string;
  status?: string | null;
  payload?: any;
};

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

function toMs(value: NormalizedChatMessage["at"]) {
  if (typeof value === "number") return value;

  if (typeof value === "string" || value instanceof Date) {
    const ms = new Date(value).getTime();
    if (Number.isFinite(ms)) return ms;
  }

  return 0;
}

function isConversationWindowExpired(messages: NormalizedChatMessage[]) {
  let lastIncomingMs = 0;

  for (const message of messages) {
    if (message.direction !== "in") continue;

    const ms = toMs(message.at);
    if (ms > lastIncomingMs) {
      lastIncomingMs = ms;
    }
  }

  if (lastIncomingMs <= 0) return false;

  return Date.now() - lastIncomingMs > 24 * 60 * 60 * 1000;
}

export default function WhatsappAdminPanel(props: {
  companyId: string | null;

  tplDefaults: Record<string, DefaultTemplate | null>;
  selectedPhone: string;
  selectedContact: ConversationContact | null;
  selectedConversationId: string | null;

  chatMessages: NormalizedChatMessage[];
  chatLoading: boolean;

  body: string;
  sending: boolean;
  toast: string | null;

  setBody: (v: string) => void;
  setToast: (v: string | null) => void;

  onSelectPhone: (
    phone: string,
    meta?: {
      name?: string;
      avatarUrl?: string | null;
      conversationId?: string | null;
      agentId?: string | null;
      phoneNumberId?: string | null;
    },
  ) => void;

  onInsertTemplate: (groupKey: TemplateGroupKey, text: string) => void;
  onSend: () => void;

  rightPanel?: React.ReactNode;
}) {
  const {
    companyId,
    tplDefaults,
    selectedPhone,
    selectedContact,
    selectedConversationId,
    chatMessages,
    chatLoading,
    body,
    sending,
    toast,
    setBody,
    setToast,
    onSelectPhone,
    onInsertTemplate,
    onSend,
  } = props;

  const conversationExpired =
    Boolean(selectedConversationId) && isConversationWindowExpired(chatMessages);

  return (
    <section className="h-[calc(100vh-180px)] min-h-[720px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid h-full grid-cols-1 lg:grid-cols-[360px_1fr]">
        <aside className="min-h-0 border-r border-slate-200 bg-white">
          <CustomersListPanel
            companyId={companyId}
            selectedPhone={selectedPhone}
            onSelectPhone={onSelectPhone}
          />
        </aside>

        <main className="flex min-h-0 flex-col bg-white">
          <div className="h-[72px] shrink-0 border-b border-slate-200 bg-white">
            <ConversationHeader contact={selectedContact} />
          </div>

          <div className="shrink-0 bg-white">
            <ChatQuickActions
              defaults={tplDefaults}
              disabled={!selectedContact || sending || chatLoading || !selectedConversationId}
              onInsertTemplate={onInsertTemplate}
            />
          </div>

          <div className="relative min-h-0 flex-1 bg-[#f5f7fb]">
            {chatLoading ? (
              <div className="h-full w-full p-4 text-sm text-muted-foreground">
                Cargando conversación...
              </div>
            ) : (
              <ChatPanel
                messages={chatMessages}
                conversationExpired={conversationExpired}
                className="h-full"
              />
            )}

            <div className="pointer-events-none absolute bottom-4 left-0 right-0 flex justify-center px-4">
              {toast ? <Toast text={toast} onClose={() => setToast(null)} /> : null}
            </div>
          </div>

          <div className="h-[76px] shrink-0 border-t border-slate-200 bg-white px-4 py-3">
            <div className="flex h-full items-center gap-3">
              <Input
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={
                  conversationExpired
                    ? "Usa una plantilla aprobada para volver a contactar..."
                    : "Escribe un mensaje..."
                }
                disabled={sending || conversationExpired}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (!sending && !conversationExpired) onSend();
                  }
                }}
                className="h-11 flex-1 rounded-xl border-0 bg-gray-100 px-4 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-70"
              />

              <Button
                onClick={onSend}
                disabled={sending || conversationExpired}
                className="h-11 rounded-xl bg-emerald-500 px-5 text-white hover:bg-emerald-600 disabled:opacity-60"
              >
                <SendHorizonal className="mr-2 h-4 w-4" />
                Enviar
              </Button>
            </div>
          </div>
        </main>
      </div>
    </section>
  );
}