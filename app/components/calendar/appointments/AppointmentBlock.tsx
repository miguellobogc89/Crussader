// app/components/calendar/appointments/AppointmentBlock.tsx
"use client";
import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Phone,
  Sparkles,
  User,
  XCircle,
} from "lucide-react";

type Props = {
  id: string;
  startAtISO: string;
  endAtISO?: string | null;
  serviceName?: string | null;
  employeeName?: string | null;
  resourceName?: string | null;
  serviceColor?: string | null;
  employeeColor?: string | null;
  status?: string | null;
  onSelect?: (id: string) => void;
  onEdit?: (id: string) => void;
  customerName?: string | null;
  customerPhone?: string | null;
  source?: string | null;
};

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    className: string;
    icon: typeof CheckCircle2;
  }
> = {
  PENDING: {
    label: "Pendiente",
    className: "text-amber-700",
    icon: AlertCircle,
  },

  BOOKED: {
    label: "Confirmada",
    className: "text-emerald-700",
    icon: CheckCircle2,
  },

  COMPLETED: {
    label: "Completada",
    className: "text-sky-700",
    icon: Sparkles,
  },

  CANCELLED: {
    label: "Cancelada",
    className: "text-rose-700",
    icon: XCircle,
  },

  NO_SHOW: {
    label: "No asistió",
    className: "text-slate-700",
    icon: XCircle,
  },
};

function formatTime(value: string) {
  const d = new Date(value);

  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default function AppointmentBlock({
  id,
  startAtISO,
  endAtISO,
  serviceName,
  employeeName,
  resourceName,
  serviceColor,
  employeeColor,
  status,
  customerName,
  customerPhone,
  source,
  onSelect,
  onEdit,
}: Props) {
  const color = employeeColor || serviceColor || "#0B6CF4";
  const normalizedStatus = status?.toUpperCase();

  const statusConfig = normalizedStatus
    ? STATUS_CONFIG[normalizedStatus] ?? null
    : null;

  const StatusIcon = statusConfig?.icon;
  const isCancelled = normalizedStatus === "CANCELLED";

  const visibleServiceName =
    source === "google" ? serviceName || "Evento Google" : serviceName;
    const baseBg = `color-mix(in srgb, ${color} 10%, white)`;
    const hoverBg = `color-mix(in srgb, ${color} 5%, white)`;
    const [isHovered, setIsHovered] = useState(false);

  return (
<button
  type="button"
  onClick={() => onSelect?.(id)}
  onDoubleClick={() => onEdit?.(id)}
  onMouseEnter={() => setIsHovered(true)}
  onMouseLeave={() => setIsHovered(false)}
  className="
    h-full w-full cursor-pointer overflow-hidden rounded-xl
    border-0 border-l-2 px-2 py-1.5 text-left
    transition-colors
    duration-100
    ease-out
    shadow-[1px_1px_2px_rgba(15,23,42,0.10)]
  "
  style={{
    borderLeftColor: color,
    backgroundColor: isHovered ? hoverBg : baseBg,
  }}
>
      <div className="flex h-full flex-col overflow-hidden">
        {/* Header */}
        <div className="relative shrink-0 overflow-hidden pr-[92px]">
          <div className="flex min-w-0 items-center gap-x-2">
            <div
              className={[
                "flex shrink-0 items-center gap-1 text-[11px] font-semibold tabular-nums leading-none",
                isCancelled ? "line-through decoration-[1px]" : "",
              ].join(" ")}
              style={{ color }}
            >
              <Clock className="h-3 w-3" strokeWidth={2.5} />

              <span>
                {formatTime(startAtISO)}
                {endAtISO ? ` – ${formatTime(endAtISO)}` : ""}
              </span>
            </div>

            <span className="text-slate-300">|</span>

            <div
              className={[
                "truncate text-[12px] font-bold leading-tight text-slate-900",
                isCancelled ? "line-through decoration-[1px]" : "",
              ].join(" ")}
            >
              {visibleServiceName}
            </div>
          </div>

          {statusConfig && StatusIcon ? (
            <span
              className={[
                "absolute right-0 top-1/2 inline-flex -translate-y-1/2 shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-white px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide shadow-sm",
                statusConfig.className,
              ].join(" ")}
            >
              <StatusIcon className="h-2.5 w-2.5" strokeWidth={2.5} />
              {statusConfig.label}
            </span>
          ) : null}
        </div>

        {/* Customer */}
        <div className="mt-1 flex min-w-0 items-center gap-3">
          {customerName ? (
            <div className="flex min-w-0 items-center gap-1 text-[11px] text-slate-700">
              <User className="h-3 w-3 shrink-0" strokeWidth={2.2} />

              <span className="truncate font-medium">{customerName}</span>
            </div>
          ) : null}

          {customerPhone ? (
            <div className="flex min-w-0 items-center gap-1 text-[11px] tabular-nums text-slate-500">
              <Phone className="h-3 w-3 shrink-0" strokeWidth={2.2} />

              <span className="truncate">{customerPhone}</span>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {employeeName || resourceName ? (
          <div className="mt-auto flex min-w-0 items-center gap-1.5 border-t border-slate-300/30 pt-1">
            {employeeName ? (
              <>
                <div
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                  style={{
                    backgroundColor: employeeColor || color,
                  }}
                >
                  {employeeName
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>

                <span className="truncate text-[11px] text-slate-600">
                  {employeeName}
                </span>
              </>
            ) : null}

            {resourceName ? (
              <span className="truncate text-[10px] text-slate-500">
                · {resourceName}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </button>
  );
}