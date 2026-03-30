// app/components/slots/Waitlist/SlotsWaitlistRow.tsx
"use client";

import { Clock3, Zap } from "lucide-react";

export type WaitlistRowItem = {
  id: string;
  customerName: string;
  customerPhone: string | null;
  serviceName: string | null;
  note: string | null;
  isUrgent: boolean;
  createdAt: string;
};

function formatRelativeTime(value: string): string {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();

  if (Number.isNaN(diffMs)) {
    return "Ahora";
  }

  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) {
    return "Ahora";
  }

  if (diffMin < 60) {
    return `Hace ${diffMin} min`;
  }

  const diffHours = Math.floor(diffMin / 60);

  if (diffHours < 24) {
    return `Hace ${diffHours} h`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `Hace ${diffDays} d`;
}

type Props = {
  item: WaitlistRowItem;
};

export function SlotsWaitlistRow({ item }: Props) {
  const badgeClasses = item.isUrgent
    ? "border-amber-200 bg-amber-50 text-amber-700"
    : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <div className="w-full rounded-2xl border border-border/60 bg-white p-4 text-left shadow-sm transition hover:border-violet-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground">
              {item.customerName}
            </p>

            {item.isUrgent ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                <Zap className="h-3 w-3" />
                Urgente
              </span>
            ) : null}
          </div>

          {item.note ? (
            <p className="mt-1 text-sm text-slate-700">{item.note}</p>
          ) : (
            <p className="mt-1 text-sm text-slate-500">Sin nota</p>
          )}

          {item.customerPhone ? (
            <p className="mt-1 text-[11px] text-muted-foreground">
              {item.customerPhone}
            </p>
          ) : null}
        </div>

        <span
          className={[
            "inline-flex shrink-0 items-center rounded-full border px-2 py-1 text-[11px] font-medium",
            badgeClasses,
          ].join(" ")}
        >
          {item.serviceName || "Sin servicio"}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
        <Clock3 className="h-3.5 w-3.5" />
        <span>{formatRelativeTime(item.createdAt)}</span>
      </div>
    </div>
  );
}