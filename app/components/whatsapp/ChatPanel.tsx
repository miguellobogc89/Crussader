// app/components/whatsapp/ChatPanel.tsx
"use client";

import { useEffect, useMemo, useRef } from "react";
import { AlertTriangle, LoaderCircle } from "lucide-react";

import IncomingMessageBubble from "@/app/components/whatsapp/IncomingMessageBubble";
import OutgoingMessageBubble from "@/app/components/whatsapp/OutgoingMessageBubble";

type MsgStatus = "sent" | "delivered" | "read" | null;

type NormalizedChatMessage = {
  id?: string | null;
  at?: number | string | Date | null;
  direction?: "in" | "out" | null;
  kind?: string | null;
  displayText?: string | null;
  status?: string | null;
  payload?: any;
};

type ChatMessage = {
  id: string;
  at: number;
  direction: "in" | "out";
  time: string;
  text: string;
  kind?: string | null;
  payload?: any;
  status?: MsgStatus;
};

type ChatBucket = {
  key: string;
  label: string;
  items: ChatMessage[];
};

function toMs(value: NormalizedChatMessage["at"]) {
  if (typeof value === "number") return value;

  if (typeof value === "string" || value instanceof Date) {
    const ms = new Date(value).getTime();

    if (Number.isFinite(ms)) return ms;
  }

  return 0;
}

function fmtTime(ms: number) {
  const d = new Date(ms);

  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
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

function asStatus(v: string | null | undefined): MsgStatus {
  if (!v) return null;

  const s = v.toLowerCase();

  if (s === "sent") return "sent";
  if (s === "delivered") return "delivered";
  if (s === "read") return "read";

  return null;
}

export default function ChatPanel({
  messages,
conversationExpired = false,
className = "",
loading = false,
}: {
  messages?: NormalizedChatMessage[] | null;
  conversationExpired?: boolean;
  className?: string;
  loading?: boolean;
}) {
  const safeMessages = Array.isArray(messages) ? messages : [];

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const chatBuckets = useMemo(() => {
    const mapped: ChatMessage[] = safeMessages
      .filter((m) => m.direction === "in" || m.direction === "out")
      .map((m, index) => {
        const at = toMs(m.at);
        const text = m.displayText ?? m.displayText ?? "—";

        return {
          id: m.id ? String(m.id) : `${m.direction}:${at}:${index}`,
          at,
          direction: m.direction as "in" | "out",
          time: fmtTime(at),
          text,
          kind: m.kind,
          payload: m.payload,
          status: asStatus(m.status),
        };
      })
      .sort((a, b) => a.at - b.at);

    const buckets: ChatBucket[] = [];

    for (const m of mapped) {
      const key = dayKeyFromMs(m.at);
      const label = dayLabelFromMs(m.at);

      let bucket = buckets[buckets.length - 1];

      if (!bucket || bucket.key !== key) {
        bucket = { key, label, items: [] };
        buckets.push(bucket);
      }

      bucket.items.push(m);
    }

    return buckets;
  }, [safeMessages]);

  useEffect(() => {
    const el = scrollRef.current;

    if (!el) return;

    el.scrollTop = el.scrollHeight;
  }, [chatBuckets.length, safeMessages.length]);

  return (
    <div
      ref={scrollRef}
      className={[
        "h-full w-full overflow-auto bg-[#f4f7fb] px-3 py-3 md:px-4 md:py-4",
        className,
      ].join(" ")}
    >
{loading ? (
  <div className="flex h-full w-full items-center justify-center">
    <LoaderCircle className="h-6 w-6 animate-spin text-[#2296ff]" />
  </div>
) : chatBuckets.length === 0 ? (
  <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
    Selecciona una conversación.
  </div>
) : (
        <div className="space-y-4">
          {chatBuckets.map((bucket) => (
            <div key={bucket.key} className="space-y-3">
              <div className="sticky top-0 z-10 flex justify-center">
                <div className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground shadow-sm">
                  {bucket.label}
                </div>
              </div>

              <div className="space-y-2">
                {bucket.items.map((message) => {
                  if (message.direction === "out") {
                    return (
                      <OutgoingMessageBubble
                        key={message.id}
                        text={message.text}
                        time={message.time}
                        status={message.status ?? null}
                        kind={message.kind}
                        payload={message.payload}
                      />
                    );
                  }

                  return (
                    <IncomingMessageBubble
                      key={message.id}
                      text={message.text}
                      time={message.time}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {conversationExpired ? (
            <div className="flex justify-center pt-1">
              <div className="max-w-[680px] rounded-2xl border border-amber-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-amber-50 p-1.5 text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                  </div>

                  <div className="text-sm leading-relaxed text-slate-700">
                    <span className="font-semibold text-slate-900">
                      La sesión de WhatsApp ha expirado.
                    </span>{" "}
                    Ya no puedes enviar mensajes libres a este contacto. Para
                    continuar la conversación, utiliza una plantilla aprobada o
                    espera a que vuelva a responder.
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}