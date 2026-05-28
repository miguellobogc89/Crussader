// app/whatsapp/hooks/useWhatsAppChatEvents.ts
"use client";

import { useEffect, useState } from "react";

export type NormalizedChatMessage = {
  id: string;
  at: string;
  direction: "in" | "out";
  kind: string;
  displayText: string;
  status: string | null;
  payload: any;
};

async function fetchConversationMessages(args: {
  companyId: string;
  conversationId: string;
}) {
  const params = new URLSearchParams();
  params.set("companyId", args.companyId);
  params.set("conversationId", args.conversationId);
  params.set("limit", "300");

  const res = await fetch(
    `/api/whatsapp/messaging/messages?${params.toString()}`,
    {
      cache: "no-store",
    },
  );

  const data = await res.json().catch(() => null);

  const messages: NormalizedChatMessage[] =
    data && data.ok && Array.isArray(data.messages)
      ? (data.messages as NormalizedChatMessage[])
      : [];

  return {
    ok: res.ok && data?.ok === true,
    messages,
  };
}

async function markConversationRead(args: {
  companyId: string;
  conversationId: string;
}) {
  fetch("/api/whatsapp/messaging/conversations/read", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  }).catch(() => null);
}

export function useWhatsAppChatEvents(args: {
  companyId: string | null;
  conversationId: string | null;
  pollMs?: number;
  initialMessages?: NormalizedChatMessage[];
}) {
  const { companyId, conversationId, pollMs = 2000, initialMessages } = args;

  const [messages, setMessages] = useState<NormalizedChatMessage[]>(
    () => initialMessages ?? [],
  );

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!companyId || !conversationId) {
      setMessages([]);
      return;
    }

    const cid = companyId;
    const convId = conversationId;
    let alive = true;

    async function tick(first: boolean) {
      if (first) setLoading(true);

      try {
        const result = await fetchConversationMessages({
          companyId: cid,
          conversationId: convId,
        });

        if (!alive) return;

        if (result.ok) {
          setMessages(result.messages);
        }
      } finally {
        if (first && alive) {
          setLoading(false);
        }
      }
    }

    tick(true);

    const intervalId = window.setInterval(() => {
      tick(false);
    }, pollMs);

    return () => {
      alive = false;
      window.clearInterval(intervalId);
    };
  }, [companyId, conversationId, pollMs]);

  useEffect(() => {
    if (!companyId || !conversationId) return;

    const hasIncoming = messages.some((message) => message.direction === "in");
    if (!hasIncoming) return;

    markConversationRead({ companyId, conversationId });
  }, [messages, companyId, conversationId]);

  return {
    messages,
    loading,
  };
}