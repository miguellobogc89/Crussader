// app/components/calendar/calendar/ShiftBlockPopover.tsx
"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export type ShiftPopoverData = {
  title: string;
  subtitle?: string | null; // ej: "09:00–13:00"
  lines?: string[]; // lista de líneas (rol, empleados, etc.)
};

type Props = {
  open: boolean;
  anchorEl: HTMLElement | null;
  data: ShiftPopoverData;

  onClose: () => void;
};

export default function ShiftBlockPopover({ open, anchorEl, data, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Cierra con ESC
  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Cierra al click fuera (pero no deja que el click baje al grid)
  useEffect(() => {
    if (!open) return;

    function onDown(e: MouseEvent) {
      const panel = panelRef.current;
      const anchor = anchorEl;

      const target = e.target as Node | null;
      if (!target) return;

      if (panel && panel.contains(target)) return;
      if (anchor && anchor.contains(target)) return;

      e.stopPropagation();
      onClose();
    }

    window.addEventListener("pointerdown", onDown, true);
    return () => window.removeEventListener("pointerdown", onDown, true);
  }, [open, anchorEl, onClose]);

  if (!open) return null;

  // Posicionamiento: relativo al bloque (anchorEl) usando su bounding rect,
  // pero sin portal (simple y robusto). El panel se dibuja fixed.
  const rect = anchorEl?.getBoundingClientRect() ?? null;

  const top = rect ? rect.top : 0;
  const left = rect ? rect.right + 10 : 0;

  return (
    <div
      ref={panelRef}
      className="fixed z-[999] w-[280px] rounded-xl border border-border bg-white shadow-lg"
      style={{
        top,
        left,
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerMove={(e) => e.stopPropagation()}
      onMouseMove={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-3 px-3 py-2 border-b border-border">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900 truncate">{data.title}</div>
          {data.subtitle ? (
            <div className="text-xs text-muted-foreground mt-0.5 truncate">{data.subtitle}</div>
          ) : null}
        </div>

        <button
          type="button"
          className="shrink-0 rounded-md p-1 hover:bg-slate-900/5"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <X size={14} />
        </button>
      </div>

      <div className="px-3 py-2">
        {Array.isArray(data.lines) && data.lines.length > 0 ? (
          <div className="space-y-1">
            {data.lines.map((t, i) => (
              <div key={`${i}-${t}`} className="text-xs text-slate-700 leading-snug">
                {t}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">Sin detalles</div>
        )}
      </div>
    </div>
  );
}
