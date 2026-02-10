// app/components/calendar/calendar/ShiftEventBlock.tsx
"use client";

import { useState } from "react";
import { User } from "lucide-react";

type Props = {
  top: number;
  height: number;

  leftPct: number; // 0..100
  widthPct: number; // 0..100

  title: string; // texto del tag (rol)
  subtitle?: string | null; // ej: "4"

  color?: string | null; // "#RRGGBB"
  onClick?: () => void;
};

function normalizeHexColor(input: string | null | undefined) {
  if (!input) return null;
  const c = String(input).trim();
  if (c.startsWith("#") && c.length === 7) return c;
  if (!c.startsWith("#") && c.length === 6) return `#${c}`;
  return null;
}

export default function ShiftEventBlock({
  top,
  height,
  leftPct,
  widthPct,
  title,
  subtitle,
  color,
  onClick,
}: Props) {
  const [isHover, setIsHover] = useState(false);

  const GAP_PX = 6;
  const safeColor = normalizeHexColor(color);

  const topPx = top + GAP_PX / 2;
  const heightPx = Math.max(0, height - GAP_PX);

  function stop(e: React.SyntheticEvent) {
    e.stopPropagation();
  }

  const borderColor = isHover
    ? safeColor
      ? `${safeColor}AA`
      : "rgba(15,23,42,0.30)"
    : safeColor
      ? `${safeColor}55`
      : "rgba(15,23,42,0.10)";

  return (
    <button
      type="button"
      className="absolute rounded-lg px-2 py-1 text-xs shadow-sm overflow-hidden text-left cursor-pointer pointer-events-auto"
      style={{
        top: topPx,
        height: heightPx,
        left: `calc(${leftPct}% + ${GAP_PX / 2}px)`,
        width: `calc(${widthPct}% - ${GAP_PX}px)`,

        backgroundColor: safeColor ? `${safeColor}22` : "rgba(15,23,42,0.05)",

        // ✅ SOLO shorthand (evita el warning)
        border: `1px solid ${borderColor}`,

        boxShadow: isHover ? "0 0 0 2px rgba(15,23,42,0.08)" : undefined,
      }}
      onMouseEnter={(e) => {
        stop(e);
        setIsHover(true);
      }}
      onMouseLeave={(e) => {
        stop(e);
        setIsHover(false);
      }}
      onMouseMove={stop}
      onPointerEnter={stop}
      onPointerMove={stop}
      onPointerDown={stop}
      onClick={(e) => {
        stop(e);
        onClick?.();
      }}
    >
      {/* TAG arriba izquierda (sin borde) */}
      <div className="absolute left-2 top-2 max-w-[calc(100%-16px)]">
        <div
          className="inline-flex max-w-full items-center rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-900"
          style={{
            backgroundColor: safeColor ? `${safeColor}33` : "rgba(255,255,255,0.7)",
          }}
          title={title}
        >
          <span className="truncate">{title}</span>
        </div>
      </div>

      {/* Contenido inferior derecho */}
      {subtitle ? (
        <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[11px] font-semibold text-slate-900/80">
          <User size={12} />
          <span>{subtitle}</span>
        </div>
      ) : null}
    </button>
  );
}
