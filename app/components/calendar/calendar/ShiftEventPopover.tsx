// app/components/calendar/calendar/ShiftEventPopover.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  x: number; // clientX
  y: number; // clientY

  title: string;
  subtitle?: string | null;

  // aquí metemos los nombres (uno por línea)
  lines: string[];

  color?: string | null;

  onRequestClose?: () => void;
};

function clamp(n: number, min: number, max: number) {
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

export default function ShiftEventPopover({
  x,
  y,
  title,
  subtitle,
  lines,
  color,
  onRequestClose,
}: Props) {
  const [vw, setVw] = useState(1200);
  const [vh, setVh] = useState(800);

  useEffect(() => {
    function onResize() {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
    }
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const W = 260;
  const offsetX = 14;
  const offsetY = 14;

  const pos = useMemo(() => {
    const left = clamp(x + offsetX, 8, Math.max(8, vw - W - 8));
    const top = clamp(y + offsetY, 8, Math.max(8, vh - 120)); // dejamos margen, altura es auto
    return { left, top };
  }, [x, y, vw, vh]);

  const safeColor = color && color.startsWith("#") ? color : null;

  const subtitleText =
    subtitle && subtitle.trim().length > 0 ? subtitle.trim() : null;

  const userNames = (lines ?? []).map((s) => String(s).trim()).filter(Boolean);

  return (
    <div
      className="fixed"
      style={{
        left: pos.left,
        top: pos.top,
        width: W,
        zIndex: 9999,

        // sigue bloqueando interacción hacia el grid
        pointerEvents: "none",
      }}
      onMouseDown={() => onRequestClose?.()}
    >
      <div
        className="rounded-xl border border-slate-900/10 shadow-lg backdrop-blur px-3 py-2"
        style={{
          // 1) background opaco 95%
          backgroundColor: "rgba(255,255,255,0.95)",
          boxShadow: "0 12px 32px rgba(2,6,23,0.18)",
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[12px] font-semibold text-slate-900 truncate" title={title}>
              {title}
            </div>

            {/* nº (o texto corto) */}
            {subtitleText ? (
              <div className="text-[11px] text-slate-600 truncate" title={subtitleText}>
                {subtitleText}
              </div>
            ) : null}
          </div>

          <div
            className="shrink-0 h-2.5 w-2.5 rounded-full mt-1"
            style={{ backgroundColor: safeColor ? safeColor : "rgba(15,23,42,0.25)" }}
          />
        </div>

        {/* 2) nombres debajo del nº, uno por línea. Altura auto. */}
        {userNames.length > 0 ? (
          <div className="mt-2 space-y-1">
            {userNames.map((name, i) => (
              <div
                key={`${i}-${name}`}
                className="text-[11px] text-slate-700"
                title={name}
              >
                {name}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
