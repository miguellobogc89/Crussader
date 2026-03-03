// app/components/admin/integrations/whatsapp/CustomersListPanel.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Separator } from "@/app/components/ui/separator";
import ScrollBar from "@/app/components/crussader/UX/ScrollBar";

import SearchBar from "@/app/components/admin/integrations/whatsapp/ContactsPanel/SearchBar";
import GroupHeader from "@/app/components/admin/integrations/whatsapp/ContactsPanel/GroupHeader";
import ConversationRowItem from "@/app/components/admin/integrations/whatsapp/ContactsPanel/ConversationRowItem";
import CustomerRowItem from "@/app/components/admin/integrations/whatsapp/ContactsPanel/CustomerRowItem";

import { Clock, Star, MessageCircle, Users } from "lucide-react";

export type ContactMeta = {
  name: string;
  avatarUrl?: string | null;
  conversationId?: string;

  // ✅ nuevos (para panel SYSTEM turns)
  agentId?: string | null;
  phoneNumberId?: string | null; // callee
  environment?: "TEST" | "PROD";
};

type WaConversationListItem = {
  id: string; // conversationId
  contact: {
    name: string | null;
    phone_e164: string | null;
    external_id: string;
  };

  // ✅ nuevos (si los devuelve la API)
  agentId?: string | null;
  phoneNumberId?: string | null;
  environment?: "TEST" | "PROD";

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

  // ✅ nuevos
  agentId: string | null;
  phoneNumberId: string | null;
  environment: "TEST" | "PROD";
};

export type CustomerListItem = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  createdAt?: string;
  updatedAt?: string;
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

async function fetchWaConversations(companyId: string, q: string) {
  const params = new URLSearchParams();
  params.set("companyId", companyId);
  params.set("limit", "50");

  let res: Response;

  try {
    res = await fetch(`/api/whatsapp/messaging/conversations?${params.toString()}`, {
      cache: "no-store",
    });
  } catch (err) {
    console.error("[WA] fetch conversations network error:", err);
    return { ok: false, items: [] as WaConversationListItem[] };
  }

  const contentType = res.headers.get("content-type") || "";
  const raw = await res.text().catch(() => "");

  if (!res.ok) {
    console.error("[WA] conversations API not ok:", {
      status: res.status,
      statusText: res.statusText,
      contentType,
      rawPreview: raw.slice(0, 300),
    });
    return { ok: false, items: [] as WaConversationListItem[] };
  }

  let data: any = null;
  if (contentType.includes("application/json")) {
    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.error("[WA] conversations JSON parse error:", e, raw.slice(0, 300));
      return { ok: false, items: [] as WaConversationListItem[] };
    }
  } else {
    console.error("[WA] conversations expected JSON but got:", {
      contentType,
      rawPreview: raw.slice(0, 300),
    });
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

async function fetchCustomers(companyId: string, q: string) {
  const params = new URLSearchParams();
  params.set("companyId", companyId);
  params.set("limit", "200");

  const res = await fetch(`/api/whatsapp/messaging/customers?${params.toString()}`, {
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);

  const items: CustomerListItem[] =
    data && data.ok && Array.isArray(data.items) ? (data.items as CustomerListItem[]) : [];

  const qq = q.trim().toLowerCase();
  if (!qq) return { ok: true, items };

  const filtered = items.filter((c) => {
    const name = (c.name || "").toLowerCase();
    const phone = normalizePhone(String(c.phone || ""));
    return name.includes(qq) || phone.includes(qq);
  });

  return { ok: true, items: filtered };
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
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [customersLoadedOnce, setCustomersLoadedOnce] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const [openPending, setOpenPending] = useState(false);
  const [openNoReview, setOpenNoReview] = useState(true);
  const [openOpen, setOpenOpen] = useState(false);
  const [openAll, setOpenAll] = useState(false);

  useEffect(() => {
    if (!companyId) return;

    const cid = companyId;
    let alive = true;

    async function loadOnce() {
      try {
        const data = await fetchWaConversations(cid, search);
        if (!alive) return;

        if (data.ok) setConvs(data.items);
        else setConvs([]);

        if (!hasLoadedOnce) setHasLoadedOnce(true);
      } catch {
        // noop
      }
    }

    loadOnce();
    const t = window.setInterval(loadOnce, 2500);

    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, [companyId, search, hasLoadedOnce]);

  useEffect(() => {
    if (!companyId) return;
    if (!openAll) return;

    const cid = companyId;
    let alive = true;

    async function loadCustomersOnce() {
      const data = await fetchCustomers(cid, search);
      if (!alive) return;

      if (data.ok) setCustomers(data.items);
      else setCustomers([]);

      setCustomersLoadedOnce(true);
    }

    loadCustomersOnce();

    return () => {
      alive = false;
    };
  }, [companyId, openAll, search]);

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

        const env: "TEST" | "PROD" =
          c.environment === "PROD" ? "PROD" : "TEST";

        return {
          conversationId: c.id,
          name,
          phoneE164: phone,
          lastAtMs: lastAtMs > 0 ? lastAtMs : Date.now(),
          lastPreview,
          unread,

          agentId: typeof c.agentId === "string" ? c.agentId : null,
          phoneNumberId: typeof c.phoneNumberId === "string" ? c.phoneNumberId : null,
          environment: env,
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
      environment: row.environment,
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

  const countPending = 0;
  const countNoReview = contacts.length;
  const countOpen = contacts.filter((c) => c.unread > 0).length;
  const countAll = customersLoadedOnce ? customers.length : 0;

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
          <GroupHeader
            title="CITAS PENDIENTES DE CONFIRMAR"
            count={countPending}
            icon={<Clock className="h-4 w-4" />}
            open={openPending}
            onToggle={() => setOpenPending((v) => !v)}
          />
          {openPending ? <div className="px-3 pb-3 text-sm text-muted-foreground">—</div> : null}

          <GroupHeader
            title="CLIENTE SIN RESEÑA"
            count={countNoReview}
            icon={<Star className="h-4 w-4" />}
            open={openNoReview}
            onToggle={() => setOpenNoReview((v) => !v)}
          />
          {openNoReview ? (
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
                <div className="p-4 text-sm text-muted-foreground">No hay conversaciones todavía.</div>
              ) : null}
            </div>
          ) : null}

          <GroupHeader
            title="RECORDATORIO PENDIENTE"
            count={countOpen}
            icon={<MessageCircle className="h-4 w-4" />}
            open={openOpen}
            onToggle={() => setOpenOpen((v) => !v)}
          />
          {openOpen ? <div className="px-3 pb-3 text-sm text-muted-foreground">—</div> : null}

          <GroupHeader
            title="TODOS"
            count={countAll}
            icon={<Users className="h-4 w-4" />}
            open={openAll}
            onToggle={() => setOpenAll((v) => !v)}
          />

          {openAll ? (
            <div className="divide-y">
              {customers.map((cu) => {
                const phoneDigits = normalizePhone(cu.phone);
                return (
                  <CustomerRowItem
                    key={cu.id}
                    customer={cu}
                    active={normalizePhone(selectedPhone) === phoneDigits}
                    onClick={() =>
                      onSelectPhone(phoneDigits, {
                        name: cu.name,
                        avatarUrl: null,
                        conversationId: undefined,

                        agentId: null,
                        phoneNumberId: null,
                        environment: "TEST",
                      })
                    }
                  />
                );
              })}

              {customersLoadedOnce && customers.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">No hay clientes todavía.</div>
              ) : null}

              {!customersLoadedOnce ? (
                <div className="p-4 text-sm text-muted-foreground">Cargando clientes…</div>
              ) : null}
            </div>
          ) : null}
        </div>
      </ScrollBar>
    </div>
  );
}