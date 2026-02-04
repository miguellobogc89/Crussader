// app/hooks/calendar/useCellPainter.ts
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type CellPainter = {
  getCellHandlers: (cellId: string) => {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerEnter: (e: React.PointerEvent) => void;
    onPointerLeave: () => void;
  };
};

export function useCellPainter(onPaintCell: (cellId: string) => void): CellPainter {
  const isDownRef = useRef(false);
  const [hoverCellId, setHoverCellId] = useState<string | null>(null);

  useEffect(() => {
    function end() {
      isDownRef.current = false;
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

  const getCellHandlers = useCallback(
    (cellId: string) => ({
      onPointerDown: (e: React.PointerEvent) => {
        if (e.button !== 0) return;
        e.preventDefault();
        isDownRef.current = true;
        onPaintCell(cellId);
      },
      onPointerEnter: (e: React.PointerEvent) => {
        setHoverCellId(cellId);
        if (!isDownRef.current) return;
        if ((e.buttons & 1) !== 1) return;
        onPaintCell(cellId);
      },
      onPointerLeave: () => setHoverCellId(null),
    }),
    [onPaintCell]
  );

  return useMemo(() => ({ getCellHandlers }), [getCellHandlers]);
}
