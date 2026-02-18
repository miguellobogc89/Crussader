// app/components/crm/lead/InviteCodePill.tsx
"use client";

import * as React from "react";
import { Button } from "@/app/components/ui/button";

type Props = {
  code: string | null;
  className?: string;
};

export default function InviteCodePill({ code, className }: Props) {
  const safeCode = code && code.trim().length > 0 ? code : null;

  async function onCopy() {
    if (!safeCode) return;
    try {
      await navigator.clipboard.writeText(safeCode);
    } catch {
      // silencioso (UI-only)
    }
  }

  if (!safeCode) {
    return (
      <span
        className={[
          "inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-700",
          "select-none",
          className ?? "",
        ].join(" ")}
      >
        —
      </span>
    );
  }

  return (
    <div className={["inline-flex items-center gap-2", className ?? ""].join(" ")}>
      <span
        className={[
          "inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5",
          "text-[10px] font-semibold tracking-[0.2em] text-slate-800",
          "font-mono",
          "select-none",
        ].join(" ")}
        aria-label="Invite code"
      >
        {safeCode}
      </span>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onCopy}
        className="h-7 px-2 text-[11px]"
      >
        Copiar
      </Button>
    </div>
  );
}
