"use client";

import { Separator } from "@/app/components/ui/separator";
import ScrollBar from "@/app/components/crussader/UX/ScrollBar";

import SearchBar from "@/app/components/admin/integrations/whatsapp/ContactsPanel/SearchBar";
import ConversationRowItem from "@/app/components/admin/integrations/whatsapp/ContactsPanel/ConversationRowItem";
import ContactsGroupsMock from "@/app/components/admin/integrations/whatsapp/ContactsPanel/ContactsGroupsMock";
import { useWhatsAppContacts } from "@/app/components/admin/integrations/whatsapp/hooks/useWhatsAppContacts";

export type ContactMeta = {
  name: string;
  avatarUrl?: string | null;
  conversationId?: string;
  agentId?: string | null;
  phoneNumberId?: string | null;
};

function normalizePhone(p: string) {
  return String(p || "").replace(/[^\d]/g, "");
}

const PROD_PHONE_NUMBER_ID = "968380903015928";

async function markConversationRead(args: { companyId: string; conversationId: string }) {
  const res = await fetch("/api/whatsapp/messaging/conversations/read", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });

  const data = await res.json().catch(() => null);
  return { ok: res.ok, data };
}

export default function CustomersListPanel({
  companyId,
  selectedPhone,
  onSelectPhone,
}: {
  companyId: string | null;
  selectedPhone: string;
  onSelectPhone: (phoneE164: string, meta?: ContactMeta) => void;
}) {
  const model = useWhatsAppContacts({
    companyId,
    phoneNumberId: PROD_PHONE_NUMBER_ID,
    pollMs: 2500,
  });

  async function handleSelect(row: {
    conversationId: string;
    name: string;
    phoneE164: string;
    unread: number;
    agentId: string | null;
    phoneNumberId: string | null;
  }) {
    onSelectPhone(row.phoneE164, {
      name: row.name,
      avatarUrl: null,
      conversationId: row.conversationId,
      agentId: row.agentId,
      phoneNumberId: row.phoneNumberId,
    });

    if (!companyId) return;
    if (row.unread <= 0) return;

    model.markConversationReadLocal(row.conversationId);

    await markConversationRead({
      companyId,
      conversationId: row.conversationId,
    });
  }

  const showInitialLoading =
    model.loadingConversations && !model.conversationsLoadedOnce;

  return (
    <div className="flex h-full min-h-0 flex-col border-b lg:border-b-0 lg:border-r">
      <SearchBar
        value={model.search}
        onChange={model.setSearch}
        onClear={() => model.setSearch("")}
        placeholder={
          model.conversationsLoadedOnce
            ? "Buscar por nombre o número..."
            : "Cargando..."
        }
      />

      <Separator />

      <ScrollBar className="flex-1 min-h-0">
        <div className="divide-y">
          {model.contacts.map((row) => (
            <ConversationRowItem
              key={row.conversationId}
              row={row}
              active={normalizePhone(selectedPhone) === row.phoneE164}
              onClick={() => handleSelect(row)}
            />
          ))}

          {model.contacts.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">
              {showInitialLoading
                ? "Cargando conversaciones…"
                : "No hay conversaciones todavía."}
            </div>
          ) : null}
        </div>
      </ScrollBar>

      <ContactsGroupsMock />
    </div>
  );
}