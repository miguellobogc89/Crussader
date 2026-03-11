"use client";

import { Check } from "lucide-react";

type MsgStatus = "sent" | "delivered" | "read" | null;

export default function OutgoingMessageBubble({
  text,
  time,
  status,
}: {
  text: string;
  time: string;
  status: MsgStatus;
}) {
  // ✓ (sent) / ✓✓ (delivered/read)
  const checks = status === "delivered" || status === "read" ? 2 : 1;

  return (
    <div className="flex justify-end">
      <div className="max-w-[82%] rounded-2xl border bg-muted/40 px-3 py-2 shadow-sm">
        <div className="whitespace-pre-wrap text-sm">{text}</div>

        <div className="mt-1 flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
          <span>{time}</span>

          <span className="flex items-center">
            <Check className="h-3.5 w-3.5" />
            {checks === 2 ? <Check className="-ml-2 h-3.5 w-3.5" /> : null}
          </span>
        </div>
      </div>
    </div>
  );
}