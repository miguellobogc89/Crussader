// app/components/calendar/AppointmentPill.tsx
"use client";

import React from "react";
import { fmtParts } from "@/app/components/calendar/calendar/tz";

type PillProps = {
  startAtISO: string;
  title: string;
  subtitle?: string;
  color?: string | null;
  onClick?: () => void;
  onDoubleClick?: () => void;
};

function fmtTimeTZ(iso: string) {
  const d = new Date(iso);
  const parts = fmtParts(d, { hour: "2-digit", minute: "2-digit" });
  const hh = parts.find((p) => p.type === "hour")?.value ?? "00";
  const mm = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${hh}:${mm}`;
}

export default function AppointmentPill({
  startAtISO,
  title,
  subtitle,
  color,
  onClick,
  onDoubleClick,
}: PillProps) {
  const bg = color?.startsWith("#")
    ? { backgroundColor: color }
    : { backgroundImage: "linear-gradient(135deg, #7C3AED, #A78BFA)" }; // fallback morado

  const timeLabel = fmtTimeTZ(startAtISO);

  return (
    <button
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className="w-full rounded-xl px-2.5 py-1.5 text-left shadow-sm hover:shadow transition
                 ring-1 ring-black/5 focus:outline-none focus-visible:ring-2"
      style={bg}
      title={`${title} • ${timeLabel}`}
      aria-label={`${title} a las ${timeLabel}`}
    >
      <div className="flex items-center gap-2 text-white/95">
        <span className="text-[11px] font-semibold bg-black/20 rounded px-1.5 py-[1px]">
          {timeLabel}
        </span>
        <span className="text-[12px] font-semibold truncate">{title}</span>
      </div>
      {subtitle && (
        <div className="text-[11px] text-white/85 truncate mt-0.5">{subtitle}</div>
      )}
    </button>
  );
}
