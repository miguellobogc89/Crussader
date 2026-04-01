// app/components/slots/Waitlist/SlotsWaitlistRow.tsx
"use client";

import { Clock3, X, Zap } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { cn } from "@/lib/utils";

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
  onRemove?: (id: string) => void;
};

export function SlotsWaitlistRow({ item, onRemove }: Props) {
  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-card p-3 text-left shadow-sm transition-all duration-150 hover:shadow-md",
        item.isUrgent ? "border-amber-200/60" : "border-border"
      )}
    >
      {onRemove ? (
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-md opacity-0 transition-opacity duration-150 hover:bg-destructive/10 group-hover:opacity-100"
        >
          <X className="h-3 w-3 text-destructive" />
        </button>
      ) : null}

      <div className="flex items-start gap-2">
        {item.isUrgent ? (
          <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
        ) : null}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {item.customerName}
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge className="h-5 border-0 bg-blue-50 px-2 text-[10px] font-medium text-blue-700">
              {item.serviceName || "Sin servicio"}
            </Badge>

            {item.isUrgent ? (
              <Badge className="h-5 border-0 bg-amber-50 px-2 text-[10px] font-medium text-amber-700">
                Urgente
              </Badge>
            ) : null}
          </div>

          <p className="mt-1.5 truncate text-[11px] text-muted-foreground">
            {item.note || "Sin nota"}
          </p>

          {item.customerPhone ? (
            <p className="mt-1 text-[11px] text-muted-foreground/80">
              {item.customerPhone}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground/70">
        <Clock3 className="h-2.5 w-2.5" />
        <span>{formatRelativeTime(item.createdAt)}</span>
      </div>
    </div>
  );
}