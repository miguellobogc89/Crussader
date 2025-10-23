// app/components/crussader/UX/controls/AnimatedSlider.tsx
"use client";

import React, { useMemo, useRef } from "react";
import { cn } from "@/lib/utils";

export type AnimatedSliderOption = {
  value: number;
  emoji?: string;
  label?: string;
};

export type AnimatedSliderProps = {
  id: string;
  value: number;
  options: AnimatedSliderOption[];
  onChange: (v: number) => void;
  gradientFromTo?: string;
  className?: string;
  trackClassName?: string;
  thicknessPx?: number;
  widthPercent?: number;
  showLabels?: boolean;
  emphasizeSelected?: boolean;
  triangleColorClass?: string; // usa currentColor
};

export default function AnimatedSlider({
  id,
  value,
  options,
  onChange,
  gradientFromTo = "from-blue-400 to-orange-400",
  className,
  trackClassName,
  thicknessPx = 12,
  widthPercent = 94,
  showLabels = true,
  emphasizeSelected = true,
  triangleColorClass = "text-primary",
}: AnimatedSliderProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const { idx, count, pct } = useMemo(() => {
    const i = Math.max(0, options.findIndex((o) => o.value === value));
    const c = options.length || 1;
    const p = c > 1 ? (i / (c - 1)) * 100 : 0;
    return { idx: i, count: c, pct: p };
  }, [options, value]);

  function setByClientX(clientX: number) {
    const el = trackRef.current; // <- medir el TRACK exacto
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    const ratio = rect.width > 0 ? x / rect.width : 0;
    const newIdx = Math.round(ratio * (count - 1));
    const target = options[newIdx];
    if (target) onChange(target.value);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(idx + 1, count - 1);
      options[next] && onChange(options[next].value);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      const prev = Math.max(idx - 1, 0);
      options[prev] && onChange(options[prev].value);
    } else if (e.key === "Home") {
      e.preventDefault();
      options[0] && onChange(options[0].value);
    } else if (e.key === "End") {
      e.preventDefault();
      options[count - 1] && onChange(options[count - 1].value);
    }
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Emojis arriba */}
      <div className="relative mb-2 h-7">
        {options.map((opt, i) => {
          const x = count > 1 ? (i / (count - 1)) * 100 : 0;
          const selected = i === idx;
          const fontSize = selected && emphasizeSelected ? "1.35rem" : "1.05rem";
          return (
            <button
              key={opt.value}
              type="button"
              aria-label={opt.label ?? String(opt.value)}
              className={cn(
                "absolute -translate-x-1/2 left-0 top-0 text-center select-none outline-none",
                selected ? "text-primary" : "text-muted-foreground"
              )}
              style={{ left: `${x}%` }}
              onClick={() => onChange(opt.value)}
            >
              <div
                className="leading-none"
                style={{
                  fontSize,
                  transform: selected && emphasizeSelected ? "translateY(-2px) scale(1.18)" : "translateY(0)",
                  transition: "transform 120ms ease, font-size 120ms ease",
                  lineHeight: 1,
                }}
              >
                {opt.emoji ?? ""}
              </div>
              {showLabels && (
                <div className="text-[10px] mt-1 hidden md:block">{opt.label ?? ""}</div>
              )}
            </button>
          );
        })}
      </div>

      {/* Track container */}
      <div
        ref={containerRef}
        className="relative mx-auto"
        style={{ width: `${widthPercent}%` }}
        onMouseDown={(e) => setByClientX(e.clientX)}
        onTouchStart={(e) => setByClientX(e.touches[0].clientX)}
        onTouchMove={(e) => setByClientX(e.touches[0].clientX)}
      >
        {/* TRACK base (medido para clicks/posiciones) */}
        <div
          ref={trackRef}
          className={cn("relative rounded-full bg-muted/70 overflow-hidden", trackClassName)}
          style={{ height: thicknessPx }}
        >
          {/* Fill */}
          <div
            className={cn("absolute left-0 top-0 h-full rounded-full bg-gradient-to-r", gradientFromTo)}
            style={{ width: `${pct}%` }}
          />
          {/* Triángulo dentro del track, anclado al borde del fill */}
          <div
            className={cn("absolute top-full mt-1 -translate-x-1/2", triangleColorClass)}
            style={{ left: `${pct}%` }}
            aria-hidden
          >
            <svg width="12" height="8" viewBox="0 0 12 8" className="block">
              <path d="M6 0 L12 8 L0 8 Z" fill="currentColor" />
            </svg>
          </div>
        </div>

        {/* Capa accesible para teclado */}
        <div
          id={id}
          role="slider"
          tabIndex={0}
          aria-valuemin={options[0]?.value ?? 0}
          aria-valuemax={options[count - 1]?.value ?? count - 1}
          aria-valuenow={value}
          aria-label={id}
          className="absolute inset-0 cursor-pointer outline-none"
          onKeyDown={onKeyDown}
        />
      </div>
    </div>
  );
}
