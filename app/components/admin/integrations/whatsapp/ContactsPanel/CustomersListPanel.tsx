// app/components/admin/integrations/whatsapp/ContactsPanel/CustomersListPanel.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Separator } from "@/app/components/ui/separator";
import ScrollBar from "@/app/components/crussader/UX/ScrollBar";

import SearchBar from "@/app/components/admin/integrations/whatsapp/ContactsPanel/SearchBar";
import ConversationRowItem from "@/app/components/admin/integrations/whatsapp/ContactsPanel/ConversationRowItem";
import ContactsGroupsMock from "@/app/components/admin/integrations/whatsapp/ContactsPanel/ContactsGroupsMock";

export type ContactMeta = {
  name: string;
  avatarUrl?: string | null;
  conversationId?: string;
  agentId?: string | null;
  phoneNumberId?: string | null;
};

type WaConversationListItem = {
  id: string; // conversationId
  contact: {
    name: string | null;
    phone_e164: string | null;
    external_id: string;
  };
  unread_count: number;
  last_message: null | {
    direction: string;
    text: string | null;
    kind: string;
    status: string | null;
    at: string; // ISO
  };
  last_message_at: string | null; // ISO
};

export type ContactRow = {
  conversationId: string;
  name: string;
  phoneE164: string;
  lastAtMs: number;
  lastPreview: string;
  unread: number;

  agentId: string | null;
  phoneNumberId: string | null;
};

function normalizePhone(p: string) {
  return String(p || "").replace(/[^\d]/g, "");
}

function safeParseMs(iso: string | null | undefined) {
  if (!iso) return 0;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return 0;
  return t;
}

// Tu número real (callee) en Cloud API
const PROD_PHONE_NUMBER_ID = "968380903015928";

async function fetchWaConversations(companyId: string, q: string) {
  const params = new URLSearchParams();
  params.set("companyId", companyId);
  params.set("limit", "50");
  params.set("phoneNumberId", PROD_PHONE_NUMBER_ID);

  let res: Response;
  try {
    res = await fetch(`/api/whatsapp/messaging/conversations?${params.toString()}`, {
      cache: "no-store",
    });
  } catch {
    return { ok: false, items: [] as WaConversationListItem[] };
  }

  const contentType = res.headers.get("content-type") || "";
  const raw = await res.text().catch(() => "");

  if (!res.ok) return { ok: false, items: [] as WaConversationListItem[] };

  if (!contentType.includes("application/json")) return { ok: false, items: [] as WaConversationListItem[] };

  let data: any = null;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, items: [] as WaConversationListItem[] };
  }

  const items: WaConversationListItem[] =
    data && data.ok && Array.isArray(data.items) ? (data.items as WaConversationListItem[]) : [];

  const qq = q.trim().toLowerCase();
  if (!qq) return { ok: true, items };

  const filtered = items.filter((c) => {
    const phoneRaw = c.contact.phone_e164 ? c.contact.phone_e164 : c.contact.external_id;
    const phone = normalizePhone(String(phoneRaw || ""));
    const name = (c.contact.name || "").toLowerCase();
    return phone.includes(qq) || name.includes(qq);
  });

  return { ok: true, items: filtered };
}

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
  const [search, setSearch] = useState("");

  const [convs, setConvs] = useState<WaConversationListItem[]>([]);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(false);

  useEffect(() => {
    if (!companyId) {
      setConvs([]);
      setHasLoadedOnce(false);
      setLoadingConvs(false);
      return;
    }

    const cid = companyId;
    let alive = true;

    async function loadOnce() {
      setLoadingConvs(true);
      try {
        const data = await fetchWaConversations(cid, search);
        if (!alive) return;

        if (data.ok) setConvs(data.items);
        else setConvs([]);

        if (!hasLoadedOnce) setHasLoadedOnce(true);
      } finally {
        if (alive) setLoadingConvs(false);
      }
    }

    loadOnce();
    const t = window.setInterval(loadOnce, 2500);

    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, [companyId, search, hasLoadedOnce]);

  const contacts = useMemo<ContactRow[]>(() => {
    return convs
      .map((c) => {
        const phoneRaw = c.contact.phone_e164 ? c.contact.phone_e164 : c.contact.external_id;
        const phone = normalizePhone(String(phoneRaw || ""));

        const nameFromWa = c.contact.name ? c.contact.name.trim() : "";
        const name = nameFromWa.length > 0 ? nameFromWa : `Contacto ${phone.slice(-4)}`;

        const lastAtMs =
          c.last_message && typeof c.last_message.at === "string" && c.last_message.at.length > 0
            ? safeParseMs(c.last_message.at)
            : safeParseMs(c.last_message_at);

        const lastPreview =
          c.last_message && typeof c.last_message.text === "string" && c.last_message.text
            ? c.last_message.text
            : "—";

        const unread = Number(c.unread_count || 0);

        return {
          conversationId: c.id,
          name,
          phoneE164: phone,
          lastAtMs: lastAtMs > 0 ? lastAtMs : Date.now(),
          lastPreview,
          unread,
          agentId: null,
          phoneNumberId: PROD_PHONE_NUMBER_ID,
        };
      })
      .filter((x) => x.phoneE164.length > 0)
      .sort((a, b) => b.lastAtMs - a.lastAtMs);
  }, [convs]);

  async function handleSelect(row: ContactRow) {
    onSelectPhone(row.phoneE164, {
      name: row.name,
      avatarUrl: null,
      conversationId: row.conversationId,
      agentId: row.agentId,
      phoneNumberId: row.phoneNumberId,
    });

    if (!companyId) return;
    if (row.unread <= 0) return;

    setConvs((prev) =>
      prev.map((x) => {
        if (x.id !== row.conversationId) return x;
        return { ...x, unread_count: 0 };
      })
    );

    await markConversationRead({ companyId, conversationId: row.conversationId });
  }

  const loadingUi = loadingConvs;

  return (
    <div className="flex h-full min-h-0 flex-col border-b lg:border-b-0 lg:border-r">
      <SearchBar
        value={search}
        onChange={setSearch}
        onClear={() => setSearch("")}
        placeholder={hasLoadedOnce ? "Buscar por nombre o número..." : "Cargando..."}
      />

      <Separator />

      <ScrollBar className="flex-1 min-h-0">
        <div className="divide-y">
          {contacts.map((row) => (
            <ConversationRowItem
              key={row.conversationId}
              row={row}
              active={normalizePhone(selectedPhone) === row.phoneE164}
              onClick={() => handleSelect(row)}
            />
          ))}

          {contacts.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">
              {loadingUi ? "Cargando conversaciones…" : "No hay conversaciones todavía."}
            </div>
          ) : null}
        </div>
      </ScrollBar>

      <ContactsGroupsMock />
    </div>
  );
}