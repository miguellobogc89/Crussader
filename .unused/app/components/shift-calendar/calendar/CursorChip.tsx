// app/components/shift-calendar/calendar/CursorChip.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import type {
  BrushKind,
  ShiftKind,
} from "@/app/components/shift-calendar/paint-manager";
import {
  kindChipClasses,
  kindLabelEs,
  brushLabelEs,
} from "@/app/components/shift-calendar/paint-manager";

export default function CursorChip({
  show,
  brushKind,
  offset = { x: 14, y: 14 },
}: {
  show: boolean;
  brushKind: BrushKind;
  offset?: { x: number; y: number };
}) {
  const rafRef = useRef<number | null>(null);
  const latestRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    function onMove(e: PointerEvent) {
      latestRef.current = { x: e.clientX, y: e.clientY };
      if (rafRef.current != null) return;

      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        setPos(latestRef.current);
      });
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, []);

  if (!show) return null;

  const isErase = brushKind === "ERASE";
  const label = isErase ? brushLabelEs(brushKind) : kindLabelEs(brushKind as ShiftKind);
  const classes = isErase
    ? "bg-slate-100 text-slate-700 border-slate-200"
    : kindChipClasses(brushKind as ShiftKind);

  return (
    <div
      className="pointer-events-none fixed left-0 top-0 z-[80]"
      style={{ transform: `translate(${pos.x + offset.x}px, ${pos.y + offset.y}px)` }}
    >
      <div
        className={[
          "inline-flex items-center gap-2 rounded-full border px-2.5 py-1",
          "text-[11px] font-semibold shadow-sm backdrop-blur",
          classes,
        ].join(" ")}
      >
        {label}
      </div>
    </div>
  );
}
