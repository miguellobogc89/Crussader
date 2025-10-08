// app/components/calendar/AppointmentPill.tsx
import React from "react";

type PillProps = {
  startAtISO: string;
  title: string;              // p.ej. nombre del servicio
  subtitle?: string;          // p.ej. profesional o sillón
  color?: string | null;      // color del servicio si lo tienes
  onClick?: () => void;
  onDoubleClick?: () => void;
};
const fmtTime = (iso: string) =>
  new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" })
    .format(new Date(iso));

export default function AppointmentPill({ startAtISO, title, subtitle, color, onClick,onDoubleClick, }: PillProps) {
  const bg = color?.startsWith("#")
    ? { backgroundColor: color }
    : { backgroundImage: "linear-gradient(135deg, #7C3AED, #A78BFA)" }; // morado por defecto

  return (
    <button
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className="w-full rounded-xl px-2.5 py-1.5 text-left shadow-sm hover:shadow transition
                 ring-1 ring-black/5 focus:outline-none focus-visible:ring-2"
      style={bg}
      title={`${title} • ${fmtTime(startAtISO)}`}
    >
      <div className="flex items-center gap-2 text-white/95">
        <span className="text-[11px] font-semibold bg-black/20 rounded px-1.5 py-[1px]">
          {fmtTime(startAtISO)}
        </span>
        <span className="text-[12px] font-semibold truncate">{title}</span>
      </div>
      {subtitle && <div className="text-[11px] text-white/85 truncate mt-0.5">{subtitle}</div>}
    </button>
  );
}
