// app/components/crussader/UX/ProgressBar.tsx
"use client";

import React from "react";

export default function ProgressBar({
  active,
  progress,
  title = "Actualizando insights…",
  subtitle = "Esta operación puede tardar unos minutos si hay muchas reseñas pendientes.",
}: {
  active: boolean;
  progress: number;
  title?: string;
  subtitle?: string;
}) {
  if (!active) return null;

  const clamped = Math.max(0, Math.min(1, Number(progress) || 0));
  const pct = Math.round(clamped * 100);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-4 py-3">
      <div className="text-sm 2xl:text-xs font-semibold text-slate-900 leading-snug">
        {title}
      </div>
      <div className="mt-0.5 text-xs 2xl:text-[11px] text-slate-600 leading-snug">
        {subtitle}
      </div>

      <div className="mt-3">
        <div className="h-2 rounded-full bg-slate-200/80 overflow-hidden">
          <div
            className="h-full rounded-full ux-progressFill transition-[width] duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
