// app/components/whatsapp/OutgoingMessageBubble.tsx
"use client";

import { Check, Bot, MessageSquareText } from "lucide-react";

type MsgStatus = "sent" | "delivered" | "read" | "failed" | null;

function renderWhatsAppText(text: string) {
  const parts = text.split(/(\*[^*]+\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <strong key={index}>{part.slice(1, -1)}</strong>;
    }

    return <span key={index}>{part}</span>;
  });
}

function getTemplateName(payload: any) {
  if (typeof payload?.templateName === "string") return payload.templateName;
  if (typeof payload?.meta?.templateName === "string") return payload.meta.templateName;
  return null;
}

function getBubbleMeta(kind?: string | null, payload?: any) {
  if (kind === "template") {
    return {
      icon: <Bot className="h-3.5 w-3.5" />,
      label: "Plantilla WhatsApp",
      detail: getTemplateName(payload),
      className: "text-blue-600",
    };
  }

  if (kind === "interactive" || kind === "button") {
    return {
      icon: <MessageSquareText className="h-3.5 w-3.5" />,
      label: "Mensaje interactivo",
      detail: null,
      className: "text-emerald-600",
    };
  }

  return null;
}

export default function OutgoingMessageBubble({
  text,
  time,
  status,
  kind,
  payload,
}: {
  text: string;
  time: string;
  status: MsgStatus;
  kind?: string | null;
  payload?: any;
}) {
  const normalizedStatus = String(status || "").toLowerCase();
  const checks = normalizedStatus === "delivered" || normalizedStatus === "read" ? 2 : 1;
  const checksAreRead = normalizedStatus === "read";
  const meta = getBubbleMeta(kind, payload);

  return (
    <div className="flex justify-end">
      <div className="max-w-[82%] rounded-2xl border border-[#b9dcff] bg-[#e7f3ff] px-3 py-2 shadow-sm">
        {meta ? (
          <div className={`mb-2 flex items-center gap-1.5 text-[11px] font-medium ${meta.className}`}>
            {meta.icon}
            <span>{meta.label}</span>
            {meta.detail ? <span className="text-muted-foreground">· {meta.detail}</span> : null}
          </div>
        ) : null}

        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {renderWhatsAppText(text)}
        </div>

        <div className="mt-1 flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
          <span>{time}</span>

          {normalizedStatus === "failed" ? (
            <span className="text-red-500">Error</span>
          ) : (
            <span
              className={
                checksAreRead
                  ? "flex items-center text-[#2296ff]"
                  : "flex items-center text-slate-400"
              }
            >
              <Check className="h-3.5 w-3.5" />
              {checks === 2 ? <Check className="-ml-2 h-3.5 w-3.5" /> : null}
            </span>
          )}
        </div>
      </div>
    </div>
  );
} 