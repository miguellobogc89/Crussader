// app/components/admin/integrations/whatsapp/WhatsappAdminShell.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { SendHorizonal } from "lucide-react";

import ChatPanel from "@/app/components/admin/integrations/whatsapp/ChatPanel";
import CustomersListPanel from "@/app/components/admin/integrations/whatsapp/CustomersListPanel";
import { useBootstrapStore } from "@/app/providers/bootstrap-store";
import ConversationHeader, {
  type ConversationContact,
} from "@/app/components/admin/integrations/whatsapp/ConversationHeader";

import ChatQuickActions from "@/app/components/admin/integrations/whatsapp/ChatQuickActions";
import type { TemplateGroupKey } from "@/lib/whatsapp/templateGroups";

type WaDebugEvent =
  | { kind: "status"; at: number; status: string; id?: string; to?: string; ts?: string }
  | { kind: "message"; at: number; from: string; id?: string; type?: string; text?: string; ts?: string }
  | { kind: "out"; at: number; to: string; id?: string; text?: string; ts?: string; status?: string | null };

type DefaultTemplate = {
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

function normalizePhone(p: string) {
  return p.replace(/[^\d]/g, "");
}

function toE164Digits(raw: string) {
  const d = normalizePhone(raw);

  // España: si viene como 9 dígitos, prefijamos 34
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

async function fetchDebugEvents(): Promise<{ ok: boolean; count: number; events: unknown }> {
  const res = await fetch("/api/webhooks/whatsapp?debug=1", { cache: "no-store" });
  if (!res.ok) return { ok: false, count: 0, events: [] };
  const data = (await res.json()) as { ok: boolean; count: number; events: unknown };
  return data;
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

  const res = await fetch(`/api/whatsapp/messaging/messages?${params.toString()}`, { cache: "no-store" });
  const data = await res.json().catch(() => null);

  const events: WaDebugEvent[] =
    data && data.ok && Array.isArray(data.events) ? (data.events as WaDebugEvent[]) : [];

  return { ok: res.ok, events };
}

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

export default function WhatsAppAdminShell({
  initialEvents = [],
}: {
  initialEvents?: WaDebugEvent[];
}) {
  const companyId = useBootstrapStore((s) => s.data?.activeCompanyResolved?.id ?? null);

  // Debug events (se mantienen por si los quieres para diagnóstico)
  const [events, setEvents] = useState<WaDebugEvent[]>(
    Array.isArray(initialEvents) ? initialEvents : []
  );
  const [loading, setLoading] = useState(false);

  const [selectedPhone, setSelectedPhone] = useState("");
  const [selectedContact, setSelectedContact] = useState<ConversationContact | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  // Chat DB events
  const [chatEvents, setChatEvents] = useState<WaDebugEvent[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [tplDefaults, setTplDefaults] = useState<Record<string, DefaultTemplate | null>>({});

  const [debugOpen, setDebugOpen] = useState(false);

  const safeEvents = Array.isArray(events) ? events : [];

  async function refresh() {
    setLoading(true);
    try {
      const data = await fetchDebugEvents();
      if (data.ok) {
        const next = Array.isArray(data.events) ? (data.events as WaDebugEvent[]) : [];
        setEvents(next);
      }
    } finally {
      setLoading(false);
    }
  }

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

      // refresca conversación actual (si existe)
      if (companyId && selectedConversationId) {
        const r = await fetchConversationEvents({ companyId, conversationId: selectedConversationId });
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

    if (!companyId || !selectedConversationId) {
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

      const r = await fetchConversationEvents({ companyId, conversationId: selectedConversationId });
      if (r.ok) setChatEvents(r.events);
    } finally {
      setSending(false);
    }
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

  useEffect(() => {
    let alive = true;

    async function tick() {
      const data = await fetchDebugEvents();
      if (!alive) return;

      if (data.ok) {
        const next = Array.isArray(data.events) ? (data.events as WaDebugEvent[]) : [];
        setEvents(next);
      }
    }

    const t = window.setInterval(() => {
      tick();
    }, 2500);

    tick();

    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, []);

  useEffect(() => {
    if (!companyId) return;
    refreshDefaults();
  }, [companyId]);

  useEffect(() => {
    if (!toast) return;

    const t = window.setTimeout(() => {
      setToast(null);
    }, 2200);

    return () => {
      window.clearTimeout(t);
    };
  }, [toast]);

  useEffect(() => {
    if (!companyId) return;
    if (!selectedConversationId) return;

    const cid: string = companyId;
    const convId: string = selectedConversationId;

    let alive = true;

    async function tick() {
      const r = await fetchConversationEvents({
        companyId: cid,
        conversationId: convId,
      });

      if (!alive) return;
      if (r.ok) setChatEvents(r.events);
    }

    tick();

    const t = window.setInterval(() => {
      tick();
    }, 2000);

    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, [companyId, selectedConversationId]);

  useEffect(() => {
    if (!companyId) return;
    if (!selectedConversationId) return;
    if (chatEvents.length === 0) return;

    const cid: string = companyId;
    const convId: string = selectedConversationId;

    const hasIncoming = chatEvents.some((e) => e.kind === "message");
    if (!hasIncoming) return;

    markConversationRead({ companyId: cid, conversationId: convId });
  }, [chatEvents, companyId, selectedConversationId]);

  // Mantengo esto por si quieres ver debug filtrado por teléfono en algún momento
  const visibleEvents = useMemo(() => {
    const p = normalizePhone(selectedPhone.trim());
    if (!p) return safeEvents;

    return safeEvents.filter((e) => {
      if (e.kind === "message") return normalizePhone(String(e.from || "")) === p;
      if (e.kind === "out") return normalizePhone(String(e.to || "")) === p;
      if (e.kind === "status") return true;
      return false;
    });
  }, [safeEvents, selectedPhone]);

const debugLine = useMemo(() => {
  // Prioridad: conversación seleccionada (DB) -> último evento global debug -> estado
  const lastChat = chatEvents.length > 0 ? chatEvents[chatEvents.length - 1] : null;
  const lastGlobal = safeEvents.length > 0 ? safeEvents[safeEvents.length - 1] : null;

  const fmtTs = (ts?: string) => {
    if (!ts) return "";
    const n = Number(ts);
    if (Number.isFinite(n) && n > 0) {
      return new Date(n * 1000).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    }
    return "";
  };

  if (lastChat) {
    if (lastChat.kind === "message") {
      const tail = (lastChat.text ?? "").trim().slice(0, 90);
      return `DB · IN · ${fmtTs(lastChat.ts)} · from ${String(lastChat.from ?? "").slice(-10)} · ${tail}`;
    }
    if (lastChat.kind === "out") {
      const tail = (lastChat.text ?? "").trim().slice(0, 90);
      const st = lastChat.status ? ` · ${lastChat.status}` : "";
      return `DB · OUT · ${fmtTs(lastChat.ts)} · to ${String(lastChat.to ?? "").slice(-10)}${st} · ${tail}`;
    }
    if (lastChat.kind === "status") {
      return `DB · STATUS · ${fmtTs(lastChat.ts)} · ${lastChat.status}`;
    }
  }

  if (lastGlobal) {
    if (lastGlobal.kind === "message") {
      const tail = (lastGlobal.text ?? "").trim().slice(0, 90);
      return `WEBHOOK · IN · ${fmtTs(lastGlobal.ts)} · from ${String(lastGlobal.from ?? "").slice(-10)} · ${tail}`;
    }
    if (lastGlobal.kind === "out") {
      const tail = (lastGlobal.text ?? "").trim().slice(0, 90);
      const st = lastGlobal.status ? ` · ${lastGlobal.status}` : "";
      return `WEBHOOK · OUT · ${fmtTs(lastGlobal.ts)} · to ${String(lastGlobal.to ?? "").slice(-10)}${st} · ${tail}`;
    }
    if (lastGlobal.kind === "status") {
      return `WEBHOOK · STATUS · ${fmtTs(lastGlobal.ts)} · ${lastGlobal.status}`;
    }
  }

  if (loading || chatLoading) return "Actualizando…";
  return "Debug: sin eventos todavía.";
}, [chatEvents, safeEvents, loading, chatLoading]);
  
const debugRows = useMemo(() => {
  const src: WaDebugEvent[] =
    chatEvents.length > 0 ? chatEvents : safeEvents;

  const last = src.slice(-12);

  const fmtTs = (ts?: string) => {
    if (!ts) return "";
    const n = Number(ts);
    if (Number.isFinite(n) && n > 0) {
      return new Date(n * 1000).toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    }
    return "";
  };

  return last.map((e, i) => {
    if (e.kind === "status") {
      return `${fmtTs(e.ts)} · STATUS · ${e.status}`;
    }
    if (e.kind === "message") {
      const tail = (e.text ?? "").trim().slice(0, 140);
      return `${fmtTs(e.ts)} · IN · …${String(e.from ?? "").slice(-6)} · ${tail}`;
    }
    const tail = (e.text ?? "").trim().slice(0, 140);
    const st = e.status ? ` · ${e.status}` : "";
    return `${fmtTs(e.ts)} · OUT · …${String(e.to ?? "").slice(-6)}${st} · ${tail}`;
  });
}, [chatEvents, safeEvents]);

  return (
    <div className="h-[calc(100vh-180px)] min-h-[720px]">
      <Card className="h-full overflow-hidden">
        {/* FIX: antes restabas 56px sin tener CardHeader -> quedaba “footer” vacío */}
        <CardContent className="h-full p-0">
          <div className="grid h-full grid-cols-1 lg:grid-cols-[360px_1fr]">
            {/* Left */}
            <CustomersListPanel
              companyId={companyId}
              selectedPhone={selectedPhone}
              onSelectPhone={async (phone, meta) => {
                setSelectedPhone(phone);

                if (meta && meta.name) {
                  setSelectedContact({
                    name: meta.name,
                    phoneE164: phone,
                    avatarUrl: meta.avatarUrl ?? null,
                  });
                } else {
                  setSelectedContact({
                    name: "Cliente",
                    phoneE164: phone,
                    avatarUrl: null,
                  });
                }

                if (!companyId) {
                  setSelectedConversationId(null);
                  setChatEvents([]);
                  return;
                }

                if (!meta || !meta.conversationId) {
                  setSelectedConversationId(null);
                  setChatEvents([]);
                  return;
                }

                setSelectedConversationId(meta.conversationId);

                setChatLoading(true);
                try {
                  const r = await fetchConversationEvents({
                    companyId,
                    conversationId: meta.conversationId,
                  });

                  if (r.ok) setChatEvents(r.events);
                  else setChatEvents([]);
                } finally {
                  setChatLoading(false);
                }
              }}
            />

            {/* Right */}
            <div className="flex h-full min-h-0 flex-col">
<Card className="mx-4 mt-4 mb-3">
  <CardContent className="py-3">
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => setDebugOpen((v) => !v)}
        className="text-[11px] font-medium text-muted-foreground hover:text-slate-700"
      >
        DEBUG {debugOpen ? "▾" : "▸"}
      </button>

      <div className="min-w-0 flex-1 truncate text-xs text-slate-700">
        {debugLine}
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={loading}
          className="h-8 rounded-lg"
        >
          {loading ? "…" : "Refrescar"}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setEvents([]);
            setChatEvents([]);
            setToast("Debug limpiado.");
          }}
          className="h-8 rounded-lg"
        >
          Limpiar
        </Button>
      </div>
    </div>

    {debugOpen ? (
      <div className="mt-3 rounded-xl border bg-slate-50/60 px-3 py-2">
        {debugRows.length === 0 ? (
          <div className="text-xs text-muted-foreground">Sin eventos.</div>
        ) : (
          <div className="space-y-1">
            {debugRows.map((line, idx) => (
              <div key={idx} className="truncate font-mono text-[11px] text-slate-700">
                {line}
              </div>
            ))}
          </div>
        )}
      </div>
    ) : null}
  </CardContent>
</Card>
              <ConversationHeader contact={selectedContact} />

              {/* Quick actions (auto-send) */}
              <ChatQuickActions
                defaults={tplDefaults}
                disabled={!selectedContact || sending || chatLoading}
                onInsertTemplate={(groupKey: TemplateGroupKey, text: string) => {
                  if (!text || text.trim().length === 0) {
                    setToast("Esa acción no tiene plantilla asignada.");
                    return;
                  }

                  const filled = fillTemplateVars(text, selectedContact);
                  sendQuickText(filled);
                }}
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

{/* Input bar */}
<div className="border-t bg-white px-4 py-3">
  <div className="flex items-center gap-3">
    <Input
      value={body}
      onChange={(e) => setBody(e.target.value)}
      placeholder="Escribe un mensaje..."
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (!sending) handleSend();
        }
      }}
      className="h-11 flex-1 rounded-xl border-0 bg-gray-100 px-4 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
    />

    <Button
      onClick={handleSend}
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
    </div>
  );
}