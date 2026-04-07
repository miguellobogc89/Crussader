// app/components/calendar/calendar/AppointmentBlock.tsx
"use client";

type Props = {
  id: string;
  startAtISO: string;
  serviceName?: string | null;
  employeeName?: string | null;
  resourceName?: string | null;
  serviceColor?: string | null;
  onSelect?: (id: string) => void;
  onEdit?: (id: string) => void;
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
  onSelect,
  onEdit,
}: Props) {
  return (
    <button
      type="button"
      onClick={() => {
        if (onSelect) onSelect(id);
      }}
      onDoubleClick={() => {
        if (onEdit) onEdit(id);
      }}
      className={[
        "h-full w-full overflow-hidden border text-left transition-all",
        "rounded-md",
        "border-[#0B6CF4]/60 bg-[#0B6CF4]/15",
        "hover:bg-[#0B6CF4]/12",
        "px-2 py-1.5",
      ].join(" ")}
    >
      <div className="flex h-full flex-col gap-1">
        <div className="text-[11px] font-semibold leading-none text-[#0B6CF4]">
          {formatTime(startAtISO)}
        </div>

        <div className="flex min-w-0 flex-wrap gap-1">
          {serviceName ? (
            <span className="inline-flex max-w-full items-center rounded-md border border-[#0B6CF4]/35 bg-white/70 px-1.5 py-0.5 text-[11px] font-medium text-slate-800">
              <span className="truncate">{serviceName}</span>
            </span>
          ) : null}

          {employeeName ? (
            <span className="inline-flex max-w-full items-center rounded-md border border-[#0B6CF4]/35 bg-white/70 px-1.5 py-0.5 text-[11px] font-medium text-slate-700">
              <span className="truncate">{employeeName}</span>
            </span>
          ) : null}

          {resourceName ? (
            <span className="inline-flex max-w-full items-center rounded-md border border-[#0B6CF4]/25 bg-white/60 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
              <span className="truncate">{resourceName}</span>
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}