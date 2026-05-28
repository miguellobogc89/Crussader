// app/components/whatsapp/ContactsPanel/CustomersListPanel.tsx
"use client";

import ScrollBar from "@/app/components/crussader/UX/ScrollBar";

import SearchBar from "@/app/components/whatsapp/ContactsPanel/SearchBar";
import ConversationRowItem from "@/app/components/whatsapp/ContactsPanel/ConversationRowItem";
import { useWhatsAppContacts } from "@/app/whatsapp/hooks/useWhatsAppContacts";

export type ContactMeta = {
  name: string;
  avatarUrl?: string | null;
  conversationId?: string;
  agentId?: string | null;
  phoneNumberId?: string | null;
};

export type ContactRow = {
  conversationId: string;
  name: string;
  phoneE164: string;
  avatarUrl?: string | null;
  unread: number;
  agentId: string | null;
  phoneNumberId: string | null;
  lastAtMs: number;
  lastPreview: string;
  conversationExpired?: boolean;
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

async function deleteConversation(args: { companyId: string; conversationId: string }) {
  const res = await fetch("/api/whatsapp/messaging/conversations/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });

  const data = await res.json().catch(() => null);
  return { ok: res.ok, data };
}

function ConversationRowSkeleton() {
  return (
    <div className="flex h-[74px] items-center gap-3 rounded-xl px-3 py-2">
      <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200" />

      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-3.5 w-32 animate-pulse rounded-full bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200" />
        <div className="h-3 w-48 animate-pulse rounded-full bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200" />
      </div>

      <div className="h-3 w-10 animate-pulse rounded-full bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200" />
    </div>
  );
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

  async function handleSelect(row: ContactRow) {
    onSelectPhone(row.phoneE164, {
      name: row.name,
      avatarUrl: row.avatarUrl ?? null,
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

async function handleDeleteConversation(row: ContactRow) {
  if (!companyId) return;

  // quitar visualmente al instante
  model.removeConversationLocal(row.conversationId);

  const res = await deleteConversation({
    companyId,
    conversationId: row.conversationId,
  });

  if (!res.ok) {
    // opcional: luego podemos meter toast/error
    return;
  }
}

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex h-[72px] shrink-0 items-center border-b border-slate-200 px-4">
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
      </div>

      <ScrollBar className="min-h-0 flex-1">
        <div className="flex flex-col gap-1.5 px-2 py-2">
{showInitialLoading ? (
  Array.from({ length: 9 }).map((_, index) => (
    <ConversationRowSkeleton key={index} />
  ))
) : (
  model.contacts.map((row) => (
    <ConversationRowItem
      key={row.conversationId}
      row={row}
      active={normalizePhone(selectedPhone) === row.phoneE164}
      onClick={() => handleSelect(row)}
      onDelete={() => handleDeleteConversation(row)}
    />
  ))
)}

{!showInitialLoading && model.contacts.length === 0 ? (
  <div className="p-4 text-sm text-muted-foreground">
    No hay conversaciones todavía.
  </div>
) : null}
        </div>
      </ScrollBar>

    </div>
  );
}