// app/components/admin/integrations/whatsapp/WhatsappAdminShell.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useBootstrapStore } from "@/app/providers/bootstrap-store";

import WhatsappAdminPanel, {
  type WaDebugEvent,
  type DefaultTemplate,
} from "@/app/components/admin/integrations/whatsapp/WhatsappAdminPanel";

import type { ConversationContact } from "@/app/components/admin/integrations/whatsapp/ConversationHeader";
import type { TemplateGroupKey } from "@/lib/whatsapp/templateGroups";

function normalizePhone(p: string) {
  return String(p || "").replace(/[^\d]/g, "");
}

function toE164Digits(raw: string) {
  const d = normalizePhone(raw);
  if (d.length === 9) return `34${d}`;
  return d;
}

function fillTemplateVars(text: string, contact: ConversationContact | null) {
  let out = text;

  if (contact && typeof contact.name === "string" && contact.name.trim().length > 0) {
    out = out.replace(/\{\{\s*1\s*\}\}/g, contact.name.trim());
  }

  return out;
}

async function sendTest(to: string, body: string) {
  const res = await fetch("/api/integrations/meta/whatsapp/send-test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, body }),
  });

  const data = await res.json().catch(() => null);
  return { ok: res.ok, data };
}

async function fetchTemplateDefaults(companyId: string) {
  const res = await fetch(
    `/api/whatsapp/templates/defaults?companyId=${encodeURIComponent(companyId)}`,
    { cache: "no-store" }
  );
  if (!res.ok) return { ok: false, defaults: {} as Record<string, DefaultTemplate | null> };
  const data = (await res.json()) as {
    ok: boolean;
    defaults: Record<string, DefaultTemplate | null>;
  };
  return data;
}

async function fetchConversationEvents(args: { companyId: string; conversationId: string }) {
  const params = new URLSearchParams();
  params.set("companyId", args.companyId);
  params.set("conversationId", args.conversationId);
  params.set("limit", "300");

  const res = await fetch(`/api/whatsapp/messaging/messages?${params.toString()}`, {
    cache: "no-store",
  });
  const data = await res.json().catch(() => null);

  const events: WaDebugEvent[] =
    data && data.ok && Array.isArray(data.events) ? (data.events as WaDebugEvent[]) : [];

  return { ok: res.ok, events };
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

type SystemTurn = { id: string; at: number; text: string; payload?: unknown };

type SessionMemory = {
  profile?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    [k: string]: unknown;
  };
  state?: Record<string, unknown>;
  [k: string]: unknown;
};

async function fetchSystemTurns(args: {
  companyId: string;
  conversationId: string;
  limit?: number;
}) {
  const params = new URLSearchParams();
  params.set("companyId", args.companyId);
  params.set("conversationId", args.conversationId);
  params.set("limit", String(args.limit ?? 200));

  const res = await fetch(`/api/whatsapp/agent/turns?${params.toString()}`, {
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);

  const events: SystemTurn[] =
    data && data.ok && Array.isArray(data.events) ? (data.events as SystemTurn[]) : [];

  const memory: SessionMemory | null =
    data && data.ok && data.memory && typeof data.memory === "object"
      ? (data.memory as SessionMemory)
      : null;

  return { ok: res.ok, events, memory };
}

type SelectedThreadMeta = {
  conversationId: string | null;
  agentId: string | null;
  phoneNumberId: string | null;
  environment: "TEST" | "PROD";
};

export default function WhatsAppAdminShell() {
  const companyId = useBootstrapStore((s) => s.data?.activeCompanyResolved?.id ?? null);

  const [selectedPhone, setSelectedPhone] = useState("");
  const [selectedContact, setSelectedContact] = useState<ConversationContact | null>(null);

  const [thread, setThread] = useState<SelectedThreadMeta>({
    conversationId: null,
    agentId: null,
    phoneNumberId: null,
    environment: "TEST",
  });

  // Chat DB events
  const [chatEvents, setChatEvents] = useState<WaDebugEvent[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [tplDefaults, setTplDefaults] = useState<Record<string, DefaultTemplate | null>>({});

  async function refreshDefaults() {
    if (!companyId) return;
    const data = await fetchTemplateDefaults(companyId);
    if (data.ok) setTplDefaults(data.defaults);
  }

  async function handleSend() {
    const toTrim = toE164Digits(selectedPhone.trim());
    const bodyTrim = body.trim();

    if (!toTrim) {
      setToast("Falta el número destino.");
      return;
    }
    if (!bodyTrim) {
      setToast("Escribe un mensaje antes de enviar.");
      return;
    }

    setSending(true);
    setToast(null);

    try {
      const res = await sendTest(toTrim, bodyTrim);
      if (!res.ok) {
        setToast(
          typeof res.data === "object" && res.data
            ? JSON.stringify(res.data).slice(0, 120)
            : "Meta rechazó la petición."
        );
        return;
      }

      setBody("");

      if (companyId && thread.conversationId) {
        const r = await fetchConversationEvents({
          companyId,
          conversationId: thread.conversationId,
        });
        if (r.ok) setChatEvents(r.events);
      }
    } finally {
      setSending(false);
    }
  }

  async function sendQuickText(text: string) {
    const toTrim = toE164Digits(selectedPhone.trim());
    const bodyTrim = text.trim();

    if (!toTrim) {
      setToast("Falta el número destino.");
      return;
    }
    if (!bodyTrim) {
      setToast("Plantilla vacía.");
      return;
    }
    if (!companyId || !thread.conversationId) {
      setToast("No hay conversación seleccionada.");
      return;
    }

    setSending(true);
    setToast(null);

    try {
      const res = await sendTest(toTrim, bodyTrim);
      if (res.ok) {
        const dbg = res.data && res.data.debug ? res.data.debug : null;

        const installationFound =
          dbg && typeof dbg.installationFound === "boolean" ? dbg.installationFound : false;

        const providerMessageId =
          dbg && typeof dbg.providerMessageId === "string" ? dbg.providerMessageId : "";

        if (!installationFound) {
          setToast("Enviado a Meta, pero NO se guardó en DB (installationFound=false).");
        } else if (providerMessageId.length === 0) {
          setToast("Se guardó en DB, pero Meta no devolvió message id.");
        } else {
          setToast(`OK · DB ✔ · Meta id …${providerMessageId.slice(-6)}`);
        }
      }

      const r = await fetchConversationEvents({ companyId, conversationId: thread.conversationId });
      if (r.ok) setChatEvents(r.events);
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    refreshDefaults();
  }, [companyId]);

  useEffect(() => {
    if (!toast) return;

    const t = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  // Poll de mensajes normales de chat
  useEffect(() => {
    if (!companyId) return;
    if (!thread.conversationId) return;

    const cid = companyId;
    const convId = thread.conversationId;

    let alive = true;

    async function tick() {
      const r = await fetchConversationEvents({ companyId: cid, conversationId: convId });
      if (!alive) return;
      if (r.ok) setChatEvents(r.events);
    }

    setChatLoading(true);
    tick().finally(() => {
      if (alive) setChatLoading(false);
    });

    const t = window.setInterval(() => tick(), 2000);

    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, [companyId, thread.conversationId]);

  // Mark as read
  useEffect(() => {
    if (!companyId) return;
    if (!thread.conversationId) return;
    if (chatEvents.length === 0) return;

    const hasIncoming = chatEvents.some((e) => e.kind === "message");
    if (!hasIncoming) return;

    markConversationRead({ companyId, conversationId: thread.conversationId });
  }, [chatEvents, companyId, thread.conversationId]);

  // SYSTEM turns + session memory
  const [systemTurns, setSystemTurns] = useState<SystemTurn[]>([]);
  const [systemLoading, setSystemLoading] = useState(false);
  const [sessionMemory, setSessionMemory] = useState<SessionMemory | null>(null);

  const canFetchSystem = Boolean(companyId) && Boolean(thread.conversationId);

  useEffect(() => {
    if (!companyId) return;

    if (!thread.conversationId) {
      setSystemTurns([]);
      setSessionMemory(null);
      return;
    }

    if (!canFetchSystem) {
      setSystemTurns([]);
      setSessionMemory(null);
      return;
    }

    const cid = companyId;
    const convId = String(thread.conversationId);

    let alive = true;

    async function tick() {
      setSystemLoading(true);
      try {
        const r = await fetchSystemTurns({
          companyId: cid,
          conversationId: convId,
          limit: 200,
        });

        if (!alive) return;

        if (r.ok) {
          setSystemTurns(r.events);
          setSessionMemory(r.memory);
        } else {
          setSystemTurns([]);
          setSessionMemory(null);
        }
      } finally {
        if (alive) setSystemLoading(false);
      }
    }

    tick();
    const t = window.setInterval(() => tick(), 2000);

    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, [companyId, thread.conversationId, canFetchSystem]);

  function buildDisplayName(profile: SessionMemory["profile"] | undefined) {
    const first = profile && typeof profile.firstName === "string" ? profile.firstName.trim() : "";
    const last = profile && typeof profile.lastName === "string" ? profile.lastName.trim() : "";

    const parts: string[] = [];
    if (first.length > 0) parts.push(first);
    if (last.length > 0) parts.push(last);

    return parts.join(" ").trim();
  }

  // Pills de memoria: SOLO profile
  const memoryPills = useMemo(() => {
    const out: string[] = [];
    if (!sessionMemory) return out;

    const profile = sessionMemory.profile && typeof sessionMemory.profile === "object"
      ? sessionMemory.profile
      : undefined;

    const displayName = buildDisplayName(profile);

    const email =
      profile && typeof profile.email === "string" ? profile.email.trim() : "";
    const phone =
      profile && typeof profile.phone === "string" ? profile.phone.trim() : "";

    if (displayName.length > 0) out.push(displayName);
    if (email.length > 0) out.push(email);
    if (phone.length > 0) out.push(phone);

    return out;
  }, [sessionMemory]);

  const rightPanel = (
    <div className="flex h-full min-h-0 flex-col p-4">
      <div className="border-b pb-3">
        <div className="text-sm font-semibold">Pensamiento IA</div>
        <div className="mt-1 text-xs text-muted-foreground">
          Mensajes internos (role=SYSTEM). No se envían al cliente.
        </div>
      </div>

      {/* MEMORIA */}
      <div className="pt-3">
        <div className="text-[11px] text-muted-foreground">Memoria</div>

        <div className="mt-2 flex flex-wrap gap-2">
          {memoryPills.length === 0 ? (
            <div className="text-xs text-muted-foreground">Sin datos en memoria todavía.</div>
          ) : (
            memoryPills.map((v) => (
              <div
                key={v}
                className="inline-flex items-center rounded-full border bg-background px-3 py-1 text-[11px] font-medium"
                title={v}
              >
                {v}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Lista de mensajes SYSTEM */}
      <div className="flex-1 min-h-0 overflow-auto py-3">
        {!canFetchSystem ? (
          <div className="text-xs text-muted-foreground">
            Selecciona una conversación para ver mensajes SYSTEM.
          </div>
        ) : systemLoading && systemTurns.length === 0 ? (
          <div className="text-xs text-muted-foreground">Cargando…</div>
        ) : systemTurns.length === 0 ? (
          <div className="text-xs text-muted-foreground">Sin mensajes SYSTEM todavía.</div>
        ) : (
          <div className="space-y-2">
            {systemTurns.map((t) => (
              <div key={t.id} className="rounded-xl border bg-background px-3 py-2">
                <div className="text-sm">{t.text}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {new Date(t.at).toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <WhatsappAdminPanel
      companyId={companyId}
      tplDefaults={tplDefaults}
      selectedPhone={selectedPhone}
      selectedContact={selectedContact}
      selectedConversationId={thread.conversationId}
      chatEvents={chatEvents}
      chatLoading={chatLoading}
      body={body}
      sending={sending}
      toast={toast}
      setBody={setBody}
      setToast={setToast}
      onSelectPhone={async (
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
          name: meta && meta.name ? meta.name : "Cliente",
          phoneE164: phone,
          avatarUrl: meta && "avatarUrl" in meta ? meta.avatarUrl ?? null : null,
        });

        const nextConversationId = meta && meta.conversationId ? meta.conversationId : null;

        setThread({
          conversationId: nextConversationId,
          agentId: meta && meta.agentId ? meta.agentId : null,
          phoneNumberId: meta && meta.phoneNumberId ? meta.phoneNumberId : null,
          environment: meta && meta.environment ? meta.environment : "TEST",
        });

        if (!companyId || !nextConversationId) {
          setChatEvents([]);
          return;
        }

        setChatLoading(true);
        try {
          const r = await fetchConversationEvents({ companyId, conversationId: nextConversationId });
          if (r.ok) setChatEvents(r.events);
          else setChatEvents([]);
        } finally {
          setChatLoading(false);
        }
      }}
      onInsertTemplate={(groupKey: TemplateGroupKey, text: string) => {
        if (!text || text.trim().length === 0) {
          setToast("Esa acción no tiene plantilla asignada.");
          return;
        }

        const filled = fillTemplateVars(text, selectedContact);
        sendQuickText(filled);
      }}
      onSend={handleSend}
      rightPanel={rightPanel}
    />
  );
}