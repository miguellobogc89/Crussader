// app/components/admin/integrations/whatsapp/ContactsPanel/ConversationRowItem.tsx
"use client";

import { User } from "lucide-react";
import type { ContactRow } from "@/app/components/admin/integrations/whatsapp/ContactsPanel/CustomersListPanel";

function fmtTime(ms: number) {
  const d = new Date(ms);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ConversationRowItem({
  row,
  active,
  onClick,
}: {
  row: ContactRow;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full text-left",
        "px-3 py-3",
        "hover:bg-muted/40",
        active ? "bg-muted/50" : "bg-transparent",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full border bg-background">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="truncate text-sm font-semibold">{row.name}</div>
            <div className="shrink-0 text-xs text-muted-foreground">{fmtTime(row.lastAtMs)}</div>
          </div>

          <div className="mt-0.5 flex items-center justify-between gap-2">
            <div className="truncate text-xs text-muted-foreground">{row.lastPreview}</div>

            {row.unread > 0 ? (
              <div className="ml-2 shrink-0 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-semibold text-background">
                {row.unread > 99 ? "99+" : String(row.unread)}
              </div>
            ) : null}
          </div>

          <div className="mt-1 text-[11px] text-muted-foreground">{row.phoneE164}</div>
        </div>
      </div>
    </button>
  );
}