// app/components/crussaderAssistant/hooks/useCrussaderAssistantChatEvents.ts
"use client";

import { useEffect, useState } from "react";

export type AssistantChatEvent =
  | { kind: "status"; at: number; status: string; id?: string; to?: string; ts?: string }
  | { kind: "message"; at: number; from: string; id?: string; type?: string; text?: string; ts?: string }
  | { kind: "out"; at: number; to: string; id?: string; text?: string; ts?: string; status?: string | null };

async function fetchConversationEvents(args: { companyId: string; conversationId: string }) {
  const params = new URLSearchParams();
  params.set("companyId", args.companyId);
  params.set("conversationId", args.conversationId);
  params.set("limit", "300");

  const res = await fetch(`/api/crussader-assistant/conversations/messages?${params.toString()}`, {
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);

  const events: AssistantChatEvent[] =
    data && data.ok && Array.isArray(data.events) ? (data.events as AssistantChatEvent[]) : [];

  return { ok: res.ok, events };
}

async function markConversationRead(args: { companyId: string; conversationId: string }) {
  fetch("/api/crussader-assistant/conversations/read", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  }).catch(() => null);
}

export function useCrussaderAssistantChatEvents(args: {
  companyId: string | null;
  conversationId: string | null;
  pollMs?: number;
  initialEvents?: AssistantChatEvent[];
}) {
  const { companyId, conversationId, pollMs = 2000, initialEvents } = args;

  const [events, setEvents] = useState<AssistantChatEvent[]>(() => initialEvents ?? []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!companyId) return;

    if (!conversationId) {
      setEvents([]);
      return;
    }

    const cid = companyId;
    const convId = conversationId;
    let alive = true;

    async function tick(first: boolean) {
      if (first) setLoading(true);

      try {
        const r = await fetchConversationEvents({
          companyId: cid,
          conversationId: convId,
        });

        if (!alive) return;
        if (r.ok) setEvents(r.events);
      } finally {
        if (first && alive) setLoading(false);
      }
    }

    tick(true);

    const t = window.setInterval(() => tick(false), pollMs);

    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, [companyId, conversationId, pollMs]);

  useEffect(() => {
    if (!companyId) return;
    if (!conversationId) return;
    if (events.length === 0) return;

    const hasIncoming = events.some((e) => e.kind === "message");
    if (!hasIncoming) return;

    markConversationRead({ companyId, conversationId });
  }, [events, companyId, conversationId]);

  return { events, setEvents, loading };
}