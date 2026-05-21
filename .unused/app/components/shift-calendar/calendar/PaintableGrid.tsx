// app/components/shift-calendar/calendar/PaintableGrid.tsx
"use client";

import { useEffect, useMemo, useRef } from "react";


export type PaintableGridHandlers = {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerEnter: () => void;
  onPointerUp: () => void;
};

export type PaintableCell<T> = {
  id: string;
  disabled?: boolean;
  data: T;
};

export default function PaintableGrid<T>({
  colCount,
  cells,
  enabled,
  onPaint,
  renderCell,
}: {
  colCount: number;
  cells: Array<PaintableCell<T>>;
  enabled: boolean;
  onPaint: (cellId: string) => void;
  renderCell: (cell: PaintableCell<T>, handlers: PaintableGridHandlers) => React.ReactNode;
}) {
  const isDownRef = useRef(false);
  const isDragRef = useRef(false);
  const startIdRef = useRef<string | null>(null);
  const paintedRef = useRef<Set<string>>(new Set());

  // global end gesture (in case pointerup happens outside)
  useEffect(() => {
    function endGesture() {
      isDownRef.current = false;
      isDragRef.current = false;
      startIdRef.current = null;
      paintedRef.current = new Set();
    }

    window.addEventListener("pointerup", endGesture);
    window.addEventListener("pointercancel", endGesture);
    return () => {
      window.removeEventListener("pointerup", endGesture);
      window.removeEventListener("pointercancel", endGesture);
    };
  }, []);

  const byId = useMemo(() => {
    const m = new Map<string, PaintableCell<T>>();
    for (const c of cells) m.set(c.id, c);
    return m;
  }, [cells]);

  function beginDragIfNeeded() {
    if (isDragRef.current) return;
    isDragRef.current = true;

    const firstId = startIdRef.current;
    if (!firstId) return;

    if (paintedRef.current.has(firstId)) return;

    const cell = byId.get(firstId);
    if (!cell || cell.disabled) return;

    paintedRef.current.add(firstId);
    onPaint(firstId);
  }

  function paintIdIfNeeded(id: string) {
    if (paintedRef.current.has(id)) return;

    const cell = byId.get(id);
    if (!cell || cell.disabled) return;

    paintedRef.current.add(id);
    onPaint(id);
  }

  function makeHandlers(cellId: string): PaintableGridHandlers {
    return {
      onPointerDown: (e) => {
        if (!enabled) return;

        const cell = byId.get(cellId);
        if (!cell || cell.disabled) return;

        isDownRef.current = true;
        isDragRef.current = false;
        startIdRef.current = cellId;
        paintedRef.current = new Set();


      },

      onPointerMove: (e) => {
        if (!isDownRef.current) return;
        if (!enabled) return;

        if (!isDragRef.current) {
          const moved = Math.abs(e.movementX) + Math.abs(e.movementY) > 0;
          if (moved) beginDragIfNeeded();
        }
      },

      onPointerEnter: () => {
        if (!isDownRef.current) return;
        if (!enabled) return;

        beginDragIfNeeded();
        paintIdIfNeeded(cellId);
      },

      onPointerUp: () => {
        const wasDown = isDownRef.current;
        const wasDrag = isDragRef.current;
        const startId = startIdRef.current;

        isDownRef.current = false;
        isDragRef.current = false;
        startIdRef.current = null;
        paintedRef.current = new Set();

        if (!wasDown) return;
        if (!enabled) return;

        // click (no drag): paint once
        if (!wasDrag) {
          const id = startId || cellId;
          paintIdIfNeeded(id);
        }
      },
    };
  }

  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
      }}
    >
      {cells.map((cell) => {
        const handlers = makeHandlers(cell.id);
        return renderCell(cell, handlers);
      })}
    </div>
  );
}
