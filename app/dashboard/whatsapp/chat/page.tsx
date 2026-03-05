// app/dashboard/whatsapp/chat/page.tsx
"use client";

import { useEffect, useState } from "react";
import WhatsAppAdminShell from "@/app/components/admin/integrations/whatsapp/WhatsAppAdminShell";
import { useBootstrapStatus } from "@/app/providers/bootstrap-store";

export const dynamic = "force-dynamic";

export type WaDebugEvent =
  | {
      kind: "status";
      at: number;
      status: string;
      id?: string;
      to?: string;
      ts?: string;
    }
  | {
      kind: "message";
      at: number;
      from: string;
      id?: string;
      type?: string;
      text?: string;
      ts?: string;
    };

type DebugEventsResponse = {
  ok: boolean;
  count: number;
  events: WaDebugEvent[];
};

async function fetchDebugEvents(): Promise<DebugEventsResponse> {
  const res = await fetch(`/api/webhooks/whatsapp?debug=1`, { cache: "no-store" });
  if (!res.ok) return { ok: false, count: 0, events: [] };
  return (await res.json()) as DebugEventsResponse;
}

export default function WhatsAppChatPage() {
  const bootStatus = useBootstrapStatus();
  const isLoading = bootStatus !== "ready";

  const [events, setEvents] = useState<WaDebugEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

    useEffect(() => {
    let cancelled = false;

    async function run(first: boolean) {
        if (first) setEventsLoading(true);

        try {
        const data = await fetchDebugEvents();
        if (!cancelled) setEvents(data.events || []);
        } finally {
        if (first && !cancelled) setEventsLoading(false);
        }
    }

    run(true);

    return () => {
        cancelled = true;
    };
    }, []);

  if (isLoading || eventsLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Cargando WhatsApp…</div>;
  }

  return <WhatsAppAdminShell initialEvents={events} />;
}