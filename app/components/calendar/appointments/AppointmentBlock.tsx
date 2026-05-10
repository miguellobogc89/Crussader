// app/components/calendar/appointments/AppointmentBlock.tsx
"use client";

type Props = {
  id: string;
  startAtISO: string;
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

// Sustituye STATUS_CONFIG por esto:

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    className: string;
  }
> = {
  PENDING: {
    label: "Pendiente",
    className:
      "bg-blue-100 text-blue-700",
  },

  BOOKED: {
    label: "Booked",
    className:
      "bg-blue-100 text-blue-700",
  },

  COMPLETED: {
    label: "Realizada",
    className:
      "bg-slate-200 text-slate-700",
  },

  CANCELLED: {
    label: "Cancelada",
    className:
      "bg-red-100 text-red-700",
  },

  NO_SHOW: {
    label: "No asistió",
    className:
      "bg-red-100 text-red-700",
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
  const statusConfig = status
  ? STATUS_CONFIG[status] ?? null
  : null;



  return (
    <button
      type="button"
      onClick={() => onSelect?.(id)}
      onDoubleClick={() => onEdit?.(id)}
      className="h-full w-full cursor-pointer overflow-hidden rounded-xl border px-2 py-1.5 text-left transition-all hover:brightness-[0.98]"
      style={{
        borderColor: `${color}99`,
        backgroundColor: `${color}22`,
      }}
    >
      <div className="flex h-full flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <span
            className="text-[11px] font-bold leading-none"
            style={{ color }}
          >
            {formatTime(startAtISO)}
          </span>

{statusConfig ? (
  <span
    className={[
      "rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
      statusConfig.className,
    ].join(" ")}
  >
    {statusConfig.label}
  </span>
) : null}
        </div>

        <div className="truncate text-[12px] font-semibold leading-tight text-slate-900">
          {source === "google" ? serviceName || "Evento Google" : serviceName}
        </div>

        {customerName || customerPhone ? (
          <div className="truncate text-[10px] font-medium leading-tight text-slate-700">
            {[customerName, customerPhone].filter(Boolean).join(" · ")}
          </div>
        ) : null}

        <div className="flex min-w-0 flex-wrap gap-1">
          {employeeName ? (
            <span className="inline-flex max-w-full items-center rounded-md bg-white/75 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
              <span className="truncate">{employeeName}</span>
            </span>
          ) : null}

          {resourceName ? (
            <span className="inline-flex max-w-full items-center rounded-md bg-white/70 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
              <span className="truncate">{resourceName}</span>
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}