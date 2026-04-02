// app/components/slots/Waitlist/SlotsWaitlistRow.tsx
"use client";

import { Clock3, MoreHorizontal, Phone } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type WaitlistRowItemEmployee = {
  id: string;
  name: string;
};

export type WaitlistRowItem = {
  id: string;
  customerName: string;
  customerPhone: string | null;
  serviceName: string | null;
  note: string | null;
  isUrgent: boolean;
  isNewCustomer?: boolean;
  createdAt: string;
  employees: WaitlistRowItemEmployee[];
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
  onEdit?: (id: string) => void;
};

export function SlotsWaitlistRow({ item, onRemove, onEdit }: Props) {
  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-card p-3 text-left shadow-sm transition-all duration-150 hover:shadow-md",
        item.isUrgent ? "border-orange-200/70" : "border-border"
      )}
    >
      <div className="absolute right-2 top-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem onClick={() => onEdit?.(item.id)}>
              Editar
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => onRemove?.(item.id)}
              className="text-destructive focus:text-destructive"
            >
              Borrar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
<div className="flex items-center gap-2 pr-10 min-w-0">
  <p className="truncate text-sm font-semibold text-foreground">
    {item.customerName}
  </p>

  {item.isNewCustomer && (
    <Badge className="shrink-0 h-5 border-0 bg-emerald-50 px-2 text-[10px] font-medium text-emerald-700">
      Nuevo
    </Badge>
  )}

  {item.isUrgent && (
    <Badge className="shrink-0 h-5 border-0 bg-orange-100 px-2 text-[10px] font-medium text-orange-700">
      Urgencia
    </Badge>
  )}
</div>

          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {!item.isUrgent && (
              <Badge className="h-5 border-0 bg-blue-50 px-2 text-[10px] font-medium text-blue-700">
                {item.serviceName || "Sin servicio"}
              </Badge>
            )}

            {item.isUrgent && (
              <>
                {(item.employees ?? []).length > 0 ? (
                  (item.employees ?? []).map((employee) => (
                    <Badge
                      key={employee.id}
                      className="h-5 border-0 bg-amber-50 px-2 text-[10px] font-medium text-amber-700"
                    >
                      {employee.name}
                    </Badge>
                  ))
                ) : (
                  <Badge className="h-5 border-0 bg-amber-50 px-2 text-[10px] font-medium text-amber-700">
                    Sin empleados
                  </Badge>
                )}
              </>
            )}
          </div>

          <p className="mt-1.5 truncate text-[11px] text-muted-foreground">
            {item.note || "Sin nota"}
          </p>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground/80">
        <div className="flex items-center gap-1">
          {item.customerPhone ? (
            <>
              <Phone className="h-2.5 w-2.5" />
              <span>{item.customerPhone}</span>
            </>
          ) : null}
        </div>

        <div className="flex items-center gap-1">
          <Clock3 className="h-2.5 w-2.5" />
          <span>{formatRelativeTime(item.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}