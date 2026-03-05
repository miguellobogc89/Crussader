// app/components/admin/integrations/whatsapp/WhatsappAdminShell.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useBootstrapStore } from "@/app/providers/bootstrap-store";

import WhatsappAdminPanel, {
  type WaDebugEvent,
  type DefaultTemplate,
} from "@/app/components/admin/integrations/whatsapp/WhatsappAdminPanel";
import { useWhatsAppChatEvents } from "@/app/components/admin/integrations/whatsapp/hooks/useWhatsAppChatEvents";
import { useWhatsAppSystemTurns } from "@/app/components/admin/integrations/whatsapp/hooks/useWhatsAppSystemTurns";

import type { ConversationContact } from "@/app/components/admin/integrations/whatsapp/ConversationHeader";
import type { TemplateGroupKey } from "@/lib/whatsapp/templateGroups";
import { toWaDigits } from "@/lib/whatsapp/configuration/phone";

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

  if (!res.ok) {
    return { ok: false, defaults: {} as Record<string, DefaultTemplate | null> };
  }

  const data = (await res.json()) as {
    ok: boolean;
    defaults: Record<string, DefaultTemplate | null>;
  };

  return data;
}

type SelectedThreadMeta = {
  conversationId: string | null;
  agentId: string | null;
  phoneNumberId: string | null;
  environment: "TEST" | "PROD";
};

// ✅ tu número real (callee) en Cloud API (mientras no haya selector)
const PROD_PHONE_NUMBER_ID = "968380903015928";

export default function WhatsAppAdminShell({
  initialEvents,
}: {
  initialEvents?: WaDebugEvent[];
}) {
  const companyId = useBootstrapStore((s) => s.data?.activeCompanyResolved?.id ?? null);

  // Siempre guardamos el teléfono como "digits" (sin + ni espacios)
  const [selectedPhone, setSelectedPhone] = useState("");
  const [selectedContact, setSelectedContact] = useState<ConversationContact | null>(null);

  const [thread, setThread] = useState<SelectedThreadMeta>({
    conversationId: null,
    agentId: null,
    phoneNumberId: null,
    environment: "TEST",
  });


  // ✅ chat events (hook)
  const chatModel = useWhatsAppChatEvents({
    companyId,
    conversationId: thread.conversationId,
    pollMs: 2000,
    initialEvents,
  });

  // ✅ system turns (hook)
  const systemModel = useWhatsAppSystemTurns({
    companyId,
    conversationId: thread.conversationId,
    pollMs: 2000,
  });

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
    const vvTo = toWaDigits(selectedPhone.trim());
    if (!vvTo.ok) {
      setToast(vvTo.reason);
      return;
    }

    const toTrim = vvTo.digits;
    const bodyTrim = body.trim();

    if (toTrim.length === 0) {
      setToast("Falta el número destino.");
      return;
    }
    if (bodyTrim.length === 0) {
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

      // refrescar conversación (deja que el polling la mantenga, pero esto mejora el feedback)
      if (companyId && thread.conversationId) {
        // el hook no expone fetch, pero sí setEvents: se actualiza en el próximo tick igual
        // (si quieres instantáneo, luego exponemos "refresh()" en el hook)
      }
    } finally {
      setSending(false);
    }
  }

  async function sendQuickText(text: string) {
    const vvTo = toWaDigits(selectedPhone.trim());
    if (!vvTo.ok) {
      setToast(vvTo.reason);
      return;
    }

    const toTrim = vvTo.digits;
    const bodyTrim = text.trim();

    if (toTrim.length === 0) {
      setToast("Falta el número destino.");
      return;
    }
    if (bodyTrim.length === 0) {
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
      // polling refresca; si quieres instantáneo, luego añadimos refresh() en el hook
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

  // Pills de memoria: SOLO profile (hook ya lo calcula)
  const memoryPills = useMemo(() => systemModel.memoryPills, [systemModel.memoryPills]);

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
        {!systemModel.canFetch ? (
          <div className="text-xs text-muted-foreground">
            Selecciona una conversación para ver mensajes SYSTEM.
          </div>
        ) : systemModel.loading && systemModel.turns.length === 0 ? (
          <div className="text-xs text-muted-foreground">Cargando…</div>
        ) : systemModel.turns.length === 0 ? (
          <div className="text-xs text-muted-foreground">Sin mensajes SYSTEM todavía.</div>
        ) : (
          <div className="space-y-2">
            {systemModel.turns.map((t) => (
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
      chatEvents={chatModel.events}
      chatLoading={chatModel.loading}
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
        const vv = toWaDigits(phone);
        if (!vv.ok) {
          setToast(vv.reason);
          return;
        }

        const phoneDigits = vv.digits;

        setSelectedPhone(phoneDigits);

        setSelectedContact({
          name: meta && meta.name ? meta.name : "Cliente",
          phoneE164: phoneDigits,
          avatarUrl: meta && "avatarUrl" in (meta ?? {}) ? meta?.avatarUrl ?? null : null,
        });

        const nextConversationId = meta && meta.conversationId ? meta.conversationId : null;

        setThread({
          conversationId: nextConversationId,
          agentId: meta && meta.agentId ? meta.agentId : null,
          phoneNumberId: meta && meta.phoneNumberId ? meta.phoneNumberId : null,
          environment: meta && meta.environment ? meta.environment : "TEST",
        });

        // si seleccionas un customer "suelo" sin conversación, el hook limpiará events
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