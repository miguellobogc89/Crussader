"use client";

import { useEffect, useRef, useState } from "react";
import { Check, AlertTriangle } from "lucide-react";

type KpiItem = {
  label: string;
  current: number;
  target: number;
  /** si `true`, un valor MENOR es mejor (p.ej. tiempo de respuesta) */
  invert?: boolean;
  unit?: string; // "⭐", "%", "h", etc.
};

export type KpiTargetsProgressProps = {
  items: KpiItem[];
  barHeight?: number;             // default 10
  trackColor?: string;            // bg barra (gris)
  achievedColor?: string;         // cuando cumple objetivo
  pendingColor?: string;          // cuando NO cumple objetivo
  labelWidth?: number;            // col fija izquierda (px)
  rightWidth?: number;            // col fija derecha (px)
  showBadges?: boolean;           // mostrar badge ✓/⚠
  /** px a partir de los cuales el badge pasa a modo icon-only */
  compactAt?: number;             // default 520
};

export function KpiTargetsProgress({
  items,
  barHeight = 10,
  trackColor = "#e5e7eb", // neutral-200
  achievedColor = "hsl(var(--success))",
  pendingColor = "hsl(var(--warning))",
  labelWidth = 140,
  rightWidth = 92,
  showBadges = true,
  compactAt = 520,
}: KpiTargetsProgressProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const obs = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setCompact(w < compactAt);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [compactAt]);

  const ratio = (it: KpiItem) => {
    if (it.invert) return Math.min(1, (it.target || 0) / (it.current || Number.EPSILON));
    return Math.min(1, (it.current || 0) / (it.target || 1));
  };
  const achieved = (it: KpiItem) => (it.invert ? it.current <= it.target : it.current >= it.target);

  const Badge = ({ ok }: { ok: boolean }) => {
    if (!showBadges) return null;
    if (compact) {
      // Solo icono
      return (
        <span
          className={`inline-flex items-center justify-center rounded-full p-1 ${
            ok ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
          }`}
          title={ok ? "Logrado" : "Pendiente"}
        >
          {ok ? <Check className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
        </span>
      );
    }
    // Texto + icono
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
          ok ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
        }`}
      >
        {ok ? <Check className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
        {ok ? "Logrado" : "Pendiente"}
      </span>
    );
  };

  return (
    <div ref={ref} className="space-y-4 w-full min-w-0">
      {items.map((k, i) => {
        const r = ratio(k);
        const ok = achieved(k);
        const template = `${labelWidth}px 1fr ${rightWidth}px`;
        const color = ok ? achievedColor : pendingColor;

        return (
          <div
            key={`${k.label}-${i}`}
            className="grid items-center gap-3"
            style={{ gridTemplateColumns: template }}
          >
            {/* Col 1: etiqueta + badge (texto o icon-only según ancho) */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="truncate text-sm font-medium" title={k.label}>
                {k.label}
              </span>
              <Badge ok={ok} />
            </div>

            {/* Col 2: barra de progreso */}
            <div
              className="relative min-w-0 overflow-hidden rounded-full"
              style={{ height: barHeight, backgroundColor: trackColor }}
              aria-label={`${k.label} ${(r * 100).toFixed(0)}%`}
              role="img"
            >
              <div
                className="h-full transition-[width] duration-500"
                style={{ width: `${r * 100}%`, backgroundColor: color }}
              />
            </div>

            {/* Col 3: valores */}
            <div className="text-right">
              <span className="text-sm font-semibold">
                {k.current}{k.unit}
              </span>
              <span className="ml-1 text-sm text-muted-foreground">
                / {k.target}{k.unit}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
