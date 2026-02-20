// app/components/admin/integrations/whatsapp/ChatScreen.tsx
"use client";

import { useEffect, useMemo, useRef } from "react";
import IncomingMessageBubble from "@/app/components/admin/integrations/whatsapp/IncomingMessageBubble";
import OutgoingMessageBubble from "@/app/components/admin/integrations/whatsapp/OutgoingMessageBubble";

type WaDebugEvent =
  | {
      kind: "status";
      at: number;
      status: string;
      id?: string; // provider_message_id
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
    }
  | {
      kind: "out";
      at: number;
      to: string;
      id?: string; // provider_message_id (o local)
      text?: string;
      ts?: string;
      status?: string; // sent/delivered/read
    };

type MsgStatus = "sent" | "delivered" | "read" | null;

type ChatMessage = {
  id: string;
  at: number;
  direction: "in" | "out";
  time: string;
  text: string;
  status?: MsgStatus;
};

type ChatBucket = {
  key: string;
  label: string;
  items: ChatMessage[];
};

function safeString(v: unknown) {
  if (typeof v === "string") return v;
  return "";
}

function fmtTime(ms: number) {
  const d = new Date(ms);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function dayKeyFromMs(ms: number) {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

function dayLabelFromMs(ms: number) {
  const d = new Date(ms);
  return d.toLocaleDateString([], {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function asStatus(v: string | undefined): MsgStatus {
  if (!v) return null;
  const s = v.toLowerCase();
  if (s === "sent") return "sent";
  if (s === "delivered") return "delivered";
  if (s === "read") return "read";
  return null;
}

// Orden de prioridad: sent < delivered < read
function pickBestStatus(a: MsgStatus, b: MsgStatus): MsgStatus {
  const rank = (x: MsgStatus) => {
    if (x === "sent") return 1;
    if (x === "delivered") return 2;
    if (x === "read") return 3;
    return 0;
  };

  return rank(b) >= rank(a) ? b : a;
}

export default function ChatScreen({
  events,
  className = "",
}: {
  events: WaDebugEvent[];
  className?: string;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const chatBuckets = useMemo(() => {
    // 1) Construimos un map: provider_message_id -> status más “alto”
    const statusById = new Map<string, MsgStatus>();

    for (const e of events) {
      if (e.kind !== "status") continue;
      const id = e.id ? String(e.id) : "";
      if (!id) continue;

      const st = asStatus(e.status);
      if (!st) continue;

      const prev = statusById.get(id) ?? null;
      statusById.set(id, pickBestStatus(prev, st));
    }

    // 2) Convertimos eventos a mensajes “chat”
    const msgs: ChatMessage[] = [];

    function makeUniqueId(prefix: string, baseId: string, at: number, idx: number) {
      return `${prefix}:${baseId}:${at}:${idx}`;
    }

    let idx = 0;

    for (const e of events) {
      idx += 1;

      if (e.kind === "message") {
        const text = safeString(e.text);
        const base = e.id ? String(e.id) : `noid-in-${safeString(e.from)}`;
        msgs.push({
          id: makeUniqueId("in", base, e.at, idx),
          at: e.at,
          direction: "in",
          time: fmtTime(e.at),
          text: text.length > 0 ? text : "—",
          status: null,
        });
        continue;
      }

      if (e.kind === "out") {
        const text = safeString(e.text);
        const base = e.id ? String(e.id) : `noid-out-${safeString(e.to)}`;

        // status final: si hay status event con el mismo id, manda ese
        const stFromStatusEvent =
          e.id && statusById.has(String(e.id)) ? statusById.get(String(e.id)) ?? null : null;

        const st = stFromStatusEvent ?? asStatus(e.status);

        msgs.push({
          id: makeUniqueId("out", base, e.at, idx),
          at: e.at,
          direction: "out",
          time: fmtTime(e.at),
          text: text.length > 0 ? text : "—",
          status: st,
        });
        continue;
      }

      // status no se renderiza como mensaje
    }

    msgs.sort((a, b) => a.at - b.at);

    // 3) Buckets por día
    const buckets: ChatBucket[] = [];
    let currentBucket: ChatBucket | null = null;
    let currentKey: string | null = null;

    for (const m of msgs) {
      const key = dayKeyFromMs(m.at);
      const label = dayLabelFromMs(m.at);

      if (currentKey !== key) {
        currentKey = key;
        currentBucket = { key, label, items: [] };
        buckets.push(currentBucket);
      }

      if (!currentBucket) {
        currentBucket = { key, label, items: [] };
        buckets.push(currentBucket);
      }

      currentBucket.items.push(m);
    }

    return buckets;
  }, [events]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [chatBuckets.length, events.length]);

  return (
    <div
      ref={scrollRef}
      className={[
        "h-full w-full overflow-auto px-3 py-3 md:px-4 md:py-4",
        className,
      ].join(" ")}
    >
      {chatBuckets.length === 0 ? (
        <div className="text-sm text-muted-foreground">Sin mensajes todavía.</div>
      ) : (
        <div className="space-y-4">
          {chatBuckets.map((b) => (
            <div key={b.key} className="space-y-3">
              <div className="sticky top-0 z-10 flex justify-center">
                <div className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground shadow-sm">
                  {b.label}
                </div>
              </div>

              <div className="space-y-2">
                {b.items.map((m) => {
                  if (m.direction === "out") {
                    return (
                      <OutgoingMessageBubble
                        key={m.id}
                        text={m.text}
                        time={m.time}
                        status={m.status ?? null}
                      />
                    );
                  }

                  return <IncomingMessageBubble key={m.id} text={m.text} time={m.time} />;
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}