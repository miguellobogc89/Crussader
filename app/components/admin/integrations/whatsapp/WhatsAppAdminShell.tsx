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
import ThinkingPanel from "@/app/components/admin/integrations/whatsapp/ThinkingPanel/ThinkingPanel";

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
  <ThinkingPanel
    memoryValues={memoryPills}
    turns={systemModel.turns}
    loading={systemModel.loading}
    canFetch={systemModel.canFetch}
  />
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