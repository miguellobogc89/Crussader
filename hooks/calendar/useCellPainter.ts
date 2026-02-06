// app/hooks/calendar/useCellPainter.ts
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type CellHandlers = {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerEnter: (e: React.PointerEvent) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
};

export type CellPainter = {
  getCellHandlers: (cellId: string) => CellHandlers;
  getOverlayClass: (cellId: string) => string;
};

export function useCellPainter(onPaintCell: (cellId: string) => void): CellPainter {
  const isDownRef = useRef(false);
  const [hoverCellId, setHoverCellId] = useState<string | null>(null);

  useEffect(() => {
    function end() {
      isDownRef.current = false;
      setHoverCellId(null);
    }

    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    window.addEventListener("blur", end);

    return () => {
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      window.removeEventListener("blur", end);
    };
  }, []);

  const getOverlayClass = useCallback(
    (cellId: string) => {
      const base =
        "absolute left-0 right-0 rounded-md transition-colors duration-150";

      // OJO: no usamos paintedCellIds aquí porque tu hook actual no los gestiona.
      // El "painted" real se renderiza en otros overlays (bloques, etc).
      if (hoverCellId === cellId) {
        return `${base} bg-primary/10`;
      }

      return `${base} bg-transparent`;
    },
    [hoverCellId]
  );

  const getCellHandlers = useCallback(
    (cellId: string): CellHandlers => ({
      onPointerDown: (e: React.PointerEvent) => {
        if (e.button !== 0) return;
        e.preventDefault();
        isDownRef.current = true;
        onPaintCell(cellId);
      },

      // DayView puede pasar onPointerMove; aquí lo usamos para "drag paint"
      // sin cambiar tu lógica: solo pinta si el botón izq sigue pulsado.
      onPointerMove: (e: React.PointerEvent) => {
        if (!isDownRef.current) return;
        if ((e.buttons & 1) !== 1) return;
        onPaintCell(cellId);
      },

      onPointerEnter: (e: React.PointerEvent) => {
        setHoverCellId(cellId);

        if (!isDownRef.current) return;
        if ((e.buttons & 1) !== 1) return;

        onPaintCell(cellId);
      },

      onPointerUp: () => {
        isDownRef.current = false;
      },

      onPointerLeave: () => {
        setHoverCellId(null);
      },
    }),
    [onPaintCell]
  );

  return useMemo(
    () => ({
      getCellHandlers,
      getOverlayClass,
    }),
    [getCellHandlers, getOverlayClass]
  );
}
