// /hooks/calendar/useCellPainter.ts
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type CellPainter = {
  paintedCellIds: Set<string>;
  hoverCellId: string | null;

  setHoverCellId: (cellId: string | null) => void;

  paintCell: (cellId: string) => void;
  toggleCell: (cellId: string) => void;
  isPainted: (cellId: string) => boolean;

  getOverlayClass: (cellId: string) => string;

  getCellHandlers: (cellId: string) => {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerEnter: (e: React.PointerEvent) => void;
    onPointerLeave: () => void;
  };
};

export function useCellPainter(): CellPainter {
  const [paintedCellIds, setPaintedCellIds] = useState<Set<string>>(
    () => new Set()
  );
  const [hoverCellId, setHoverCellId] = useState<string | null>(null);

  const isDownRef = useRef(false);

  const paintCell = useCallback((cellId: string) => {
    setPaintedCellIds((prev) => {
      if (prev.has(cellId)) return prev;
      const next = new Set(prev);
      next.add(cellId);
      return next;
    });
  }, []);

  const toggleCell = useCallback((cellId: string) => {
    setPaintedCellIds((prev) => {
      const next = new Set(prev);
      if (next.has(cellId)) next.delete(cellId);
      else next.add(cellId);
      return next;
    });
  }, []);

  const isPainted = useCallback(
    (cellId: string) => paintedCellIds.has(cellId),
    [paintedCellIds]
  );

  // termina drag aunque sueltes fuera
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

  const getOverlayClass = useCallback(
    (cellId: string) => {
      const classes: string[] = [
        "absolute",
        "left-0",
        "right-0",
        "cursor-pointer",
        "select-none",
      ];

      const painted = paintedCellIds.has(cellId);
      const hover = hoverCellId === cellId;

      // sin borde: hover solo “velo” suave
      if (hover) classes.push("bg-primary/5");
      if (painted) classes.push("bg-primary/10");

      return classes.join(" ");
    },
    [hoverCellId, paintedCellIds]
  );

  const getCellHandlers = useCallback(
    (cellId: string) => {
      return {
        onPointerDown: (e: React.PointerEvent) => {
          if (e.button !== 0) return;
          e.preventDefault();
          isDownRef.current = true;
          paintCell(cellId);
        },
        onPointerEnter: (e: React.PointerEvent) => {
          setHoverCellId(cellId);

          // si estamos arrastrando con botón izq pulsado, pinta al entrar
          if (!isDownRef.current) return;
          if ((e.buttons & 1) !== 1) return;
          paintCell(cellId);
        },
        onPointerLeave: () => {
          setHoverCellId(null);
        },
      };
    },
    [paintCell]
  );

  return useMemo(
    () => ({
      paintedCellIds,
      hoverCellId,
      setHoverCellId,
      paintCell,
      toggleCell,
      isPainted,
      getOverlayClass,
      getCellHandlers,
    }),
    [paintedCellIds, hoverCellId, paintCell, toggleCell, isPainted, getOverlayClass, getCellHandlers]
  );
}
