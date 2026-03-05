// app/components/admin/integrations/whatsapp/hooks/useWhatsAppContacts.ts
"use client";

import { useEffect, useMemo, useState } from "react";

export type ContactRow = {
  conversationId: string;
  name: string;
  phoneE164: string;
  lastAtMs: number;
  lastPreview: string;
  unread: number;
  agentId: string | null;
  phoneNumberId: string | null;
  environment?: "TEST" | "PROD";
};

export type CustomerListItem = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type WaConversationListItem = {
  id: string;
  contact: { name: string | null; phone_e164: string | null; external_id: string };
  unread_count: number;
  last_message: null | {
    direction: string;
    text: string | null;
    kind: string;
    status: string | null;
    at: string;
  };
  last_message_at: string | null;
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

async function fetchWaConversations(companyId: string, phoneNumberId: string) {
  const params = new URLSearchParams();
  params.set("companyId", companyId);
  params.set("limit", "50");
  params.set("phoneNumberId", phoneNumberId);

  const res = await fetch(`/api/whatsapp/messaging/conversations?${params.toString()}`, {
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);

  const items: WaConversationListItem[] =
    data && data.ok && Array.isArray(data.items) ? (data.items as WaConversationListItem[]) : [];

  return { ok: res.ok, items };
}

async function fetchCustomers(companyId: string) {
  const params = new URLSearchParams();
  params.set("companyId", companyId);
  params.set("limit", "200");

  const res = await fetch(`/api/whatsapp/messaging/customers?${params.toString()}`, {
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);

  const items: CustomerListItem[] =
    data && data.ok && Array.isArray(data.items) ? (data.items as CustomerListItem[]) : [];

  return { ok: res.ok, items };
}

export function useWhatsAppContacts(args: {
  companyId: string | null;
  phoneNumberId: string;
  pollMs?: number;
}) {
  const { companyId, phoneNumberId, pollMs = 2500 } = args;

  const [search, setSearch] = useState("");
  const [convsRaw, setConvsRaw] = useState<WaConversationListItem[]>([]);
  const [customersRaw, setCustomersRaw] = useState<CustomerListItem[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customersLoadedOnce, setCustomersLoadedOnce] = useState(false);

  // conversaciones (poll)
  useEffect(() => {
    if (!companyId) return;

    const companyIdStrict: string = companyId;
    let alive = true;

    async function tick(first: boolean) {
      if (first) setLoadingConvs(true);
      try {
        const r = await fetchWaConversations(companyIdStrict, phoneNumberId);
        if (!alive) return;
        setConvsRaw(r.ok ? r.items : []);
      } finally {
        if (first && alive) setLoadingConvs(false);
      }
    }

    tick(true);
    const t = window.setInterval(() => tick(false), pollMs);

    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, [companyId, phoneNumberId, pollMs]);

  // customers (sin poll)
  useEffect(() => {
    if (!companyId) return;

    const companyIdStrict: string = companyId;
    let alive = true;

    async function run() {
      setLoadingCustomers(true);
      try {
        const r = await fetchCustomers(companyIdStrict);
        if (!alive) return;

        if (r.ok) {
          setCustomersRaw(r.items);
          setCustomersLoadedOnce(true);
        } else {
          setCustomersRaw([]);
        }
      } finally {
        if (alive) setLoadingCustomers(false);
      }
    }

    run();

    return () => {
      alive = false;
    };
  }, [companyId]);

  const contacts = useMemo<ContactRow[]>(() => {
    const qq = search.trim().toLowerCase();

    return convsRaw
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
          phoneNumberId,
        };
      })
      .filter((x) => x.phoneE164.length > 0)
      .filter((x) => {
        if (!qq) return true;
        return x.phoneE164.includes(qq) || x.name.toLowerCase().includes(qq);
      })
      .sort((a, b) => b.lastAtMs - a.lastAtMs);
  }, [convsRaw, search, phoneNumberId]);

  const customers = useMemo(() => {
    const qq = search.trim().toLowerCase();
    if (!qq) return customersRaw;

    return customersRaw.filter((c) => {
      const name = (c.name || "").toLowerCase();
      const phone = normalizePhone(String(c.phone || ""));
      return name.includes(qq) || phone.includes(qq);
    });
  }, [customersRaw, search]);

  return {
    search,
    setSearch,
    loading: loadingConvs || loadingCustomers,
    contacts,
    customers,
    customersLoadedOnce,
  };
}