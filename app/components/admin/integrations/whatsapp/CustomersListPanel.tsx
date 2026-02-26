// app/components/admin/integrations/whatsapp/CustomersListPanel.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/app/components/ui/input";
import { Separator } from "@/app/components/ui/separator";
import { Search, User, ChevronDown, Clock, Star, MessageCircle, Users } from "lucide-react";
import ScrollBar from "@/app/components/crussader/UX/ScrollBar";

export type ContactMeta = {
  name: string;
  avatarUrl?: string | null;
  conversationId?: string;
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

type ContactRow = {
  conversationId: string;
  name: string;
  phoneE164: string;
  lastAtMs: number;
  lastPreview: string;
  unread: number;
};

function normalizePhone(p: string) {
  return p.replace(/[^\d]/g, "");
}

function fmtTime(ms: number) {
  const d = new Date(ms);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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

type CustomerListItem = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

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

function GroupHeader({
  title,
  count,
  icon,
  open,
  onToggle,
}: {
  title: string;
  count: number;
  icon: React.ReactNode;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center gap-2 px-3 py-3 text-left hover:bg-muted/40 transition-colors"
    >
      {/* chevron primero */}
      <ChevronDown
        className={[
          "h-4 w-4 text-muted-foreground transition-transform",
          open ? "rotate-0" : "-rotate-90",
        ].join(" ")}
      />

      {/* icono */}
      <span className="flex h-5 w-5 items-center justify-center text-muted-foreground">
        {icon}
      </span>

      {/* titulo */}
      <span className="flex-1 text-[13px] font-semibold tracking-wide">
        {title}
      </span>

      {/* bolita naranja al final */}
      {count > 0 ? (
        <span className="ml-2 inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-amber-500 px-2 text-xs font-semibold text-white">
          {String(count)}
        </span>
      ) : (
        <span className="ml-2 inline-flex h-6 min-w-[24px]" />
      )}
    </button>
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
  const [search, setSearch] = useState("");
  const [convs, setConvs] = useState<WaConversationListItem[]>([]);
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
const [customersLoadedOnce, setCustomersLoadedOnce] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // independientes (no accordion)
  const [openPending, setOpenPending] = useState(false);
  const [openNoReview, setOpenNoReview] = useState(true);
  const [openOpen, setOpenOpen] = useState(false);
  const [openAll, setOpenAll] = useState(false);

  useEffect(() => {
    if (!companyId) return;

    const cid = companyId;
    let alive = true;

    async function loadOnce() {
      if (!hasLoadedOnce) setLoading(true);

      try {
        const data = await fetchWaConversations(cid, search);
        if (!alive) return;

        if (data.ok) setConvs(data.items);
        else setConvs([]);
      } finally {
        if (!hasLoadedOnce) {
          setLoading(false);
          setHasLoadedOnce(true);
        }
      }
    }

    loadOnce();
    const t = window.setInterval(loadOnce, 2500);

    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, [companyId, search]);

useEffect(() => {
  if (!companyId) return;
  if (!openAll) return;

  const cid: string = companyId; // 👈 esto fuerza a string
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

        return {
          conversationId: c.id,
          name,
          phoneE164: phone,
          lastAtMs: lastAtMs > 0 ? lastAtMs : Date.now(),
          lastPreview,
          unread,
        };
      })
      .filter((x) => x.phoneE164.length > 0)
      .sort((a, b) => b.lastAtMs - a.lastAtMs);
  }, [convs]);

  async function handleSelect(c: ContactRow) {
    onSelectPhone(c.phoneE164, { name: c.name, avatarUrl: null, conversationId: c.conversationId });

    if (!companyId) return;
    if (c.unread <= 0) return;

    setConvs((prev) =>
      prev.map((x) => {
        if (x.id !== c.conversationId) return x;
        return { ...x, unread_count: 0 };
      })
    );

    await markConversationRead({ companyId, conversationId: c.conversationId });
  }

  // contadores (de momento: sin reseña = todos)
  const countPending = 0; // luego lo alimentas con datos reales
  const countNoReview = contacts.length;
  const countOpen = contacts.filter((c) => c.unread > 0).length;
  const countAll = customersLoadedOnce ? customers.length : 0;

  return (
    <div className="flex h-full min-h-0 flex-col border-b lg:border-b-0 lg:border-r">
      <div className="p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={hasLoadedOnce ? "Buscar por nombre o número..." : "Cargando..."}
            className="pl-9"
          />
        </div>
      </div>

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
          {openPending ? (
            <div className="px-3 pb-3 text-sm text-muted-foreground">—</div>
          ) : null}

          <GroupHeader
            title="CLIENTE SIN RESEÑA"
            count={countNoReview}
            icon={<Star className="h-4 w-4" />}
            open={openNoReview}
            onToggle={() => setOpenNoReview((v) => !v)}
          />
          {openNoReview ? (
            <div className="divide-y">
              {contacts.map((c) => {
                const active = normalizePhone(selectedPhone) === c.phoneE164;

                return (
                  <button
                    key={c.conversationId}
                    type="button"
                    onClick={() => handleSelect(c)}
                    className={[
                      "w-full text-left",
                      "px-3 py-3",
                      "hover:bg-muted/40",
                      active ? "bg-muted/50" : "bg-transparent",
                    ].join(" ")}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full border bg-background">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="truncate text-sm font-semibold">{c.name}</div>
                          <div className="shrink-0 text-xs text-muted-foreground">
                            {fmtTime(c.lastAtMs)}
                          </div>
                        </div>

                        <div className="mt-0.5 flex items-center justify-between gap-2">
                          <div className="truncate text-xs text-muted-foreground">{c.lastPreview}</div>

                          {c.unread > 0 ? (
                            <div className="ml-2 shrink-0 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-semibold text-background">
                              {c.unread > 99 ? "99+" : String(c.unread)}
                            </div>
                          ) : null}
                        </div>

                        <div className="mt-1 text-[11px] text-muted-foreground">{c.phoneE164}</div>
                      </div>
                    </div>
                  </button>
                );
              })}

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
          {openOpen ? (
            <div className="px-3 pb-3 text-sm text-muted-foreground">—</div>
          ) : null}

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
      const active = normalizePhone(selectedPhone) === phoneDigits;

      return (
        <button
          key={cu.id}
          type="button"
          onClick={() =>
            onSelectPhone(phoneDigits, {
              name: cu.name,
              avatarUrl: null,
              conversationId: undefined,
            })
          }
          className={[
            "w-full text-left",
            "px-3 py-3",
            "hover:bg-muted/40",
            active ? "bg-muted/50" : "bg-transparent",
          ].join(" ")}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full border bg-background">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="truncate text-sm font-semibold">{cu.name}</div>
              </div>

              {/*<div className="mt-0.5 truncate text-xs text-muted-foreground">
                {cu.email ? cu.email : "—"}
              </div>*/}

              <div className="mt-1 text-[11px] text-muted-foreground">{phoneDigits}</div>
            </div>
          </div>
        </button>
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