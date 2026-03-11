// app/components/admin/integrations/whatsapp/ContactsPanel/GroupHeader.tsx
"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

export default function GroupHeader({
  title,
  count,
  icon,
  open,
  onToggle,
}: {
  title: string;
  count: number;
  icon: React.ReactNode;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center gap-2 px-3 py-3 text-left hover:bg-muted/40 transition-colors"
    >
      <ChevronDown
        className={[
          "h-4 w-4 text-muted-foreground transition-transform",
          open ? "rotate-0" : "-rotate-90",
        ].join(" ")}
      />

      <span className="flex h-5 w-5 items-center justify-center text-muted-foreground">{icon}</span>

      <span className="flex-1 text-[13px] font-semibold tracking-wide">{title}</span>

      {count > 0 ? (
        <span className="ml-2 inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-amber-500 px-2 text-xs font-semibold text-white">
          {String(count)}
        </span>
      ) : (
        <span className="ml-2 inline-flex h-6 min-w-[24px]" />
      )}
    </button>
  );
}