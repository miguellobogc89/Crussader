// app/components/calendar/calendar/ShiftEventResizeOverlay.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";

type Edge = "top" | "bottom";

type Props = {
  show: boolean;

  // ✅ nuevo: permitir por borde
  allowTop?: boolean;
  allowBottom?: boolean;

  onResizeStart?: (edge: Edge) => void;
  onResizeMove?: (edge: Edge, deltaPx: number) => void;
  onResizeEnd?: (edge: Edge) => void;
};

export default function ShiftEventResizeOverlay({
  show,
  allowTop,
  allowBottom,
  onResizeStart,
  onResizeMove,
  onResizeEnd,
}: Props) {
  const draggingRef = useRef<null | { edge: Edge; startY: number }>(null);
  const [draggingEdge, setDraggingEdge] = useState<Edge | null>(null);

  const canTop = allowTop !== false;
  const canBottom = allowBottom !== false;

  function stop(e: React.SyntheticEvent) {
    e.stopPropagation();
  }

  function clearDrag() {
    draggingRef.current = null;
    setDraggingEdge(null);
  }

  function onDown(edge: Edge, e: React.PointerEvent) {
    stop(e);

    if (!show) return;
    if (edge === "top" && !canTop) return;
    if (edge === "bottom" && !canBottom) return;

    if (typeof e.button === "number" && e.button !== 0) return;

    draggingRef.current = { edge, startY: e.clientY };
    setDraggingEdge(edge);

    const t = e.currentTarget as HTMLElement;
    if (t && typeof t.setPointerCapture === "function") {
      t.setPointerCapture(e.pointerId);
    }

    if (onResizeStart) onResizeStart(edge);
  }

  function onMove(e: React.PointerEvent) {
    stop(e);

    if (!show) return;

    const d = draggingRef.current;
    if (!d) return;

    const deltaPx = e.clientY - d.startY;
    if (onResizeMove) onResizeMove(d.edge, deltaPx);
  }

  function endDrag(e: React.PointerEvent) {
    stop(e);

    const d = draggingRef.current;
    if (!d) return;

    const edge = d.edge;
    clearDrag();

    if (onResizeEnd) onResizeEnd(edge);
  }

  useEffect(() => {
    function onWinUp() {
      const d = draggingRef.current;
      if (!d) return;

      const edge = d.edge;
      clearDrag();
      if (onResizeEnd) onResizeEnd(edge);
    }

    function onWinBlur() {
      const d = draggingRef.current;
      if (!d) return;

      const edge = d.edge;
      clearDrag();
      if (onResizeEnd) onResizeEnd(edge);
    }

    window.addEventListener("pointerup", onWinUp);
    window.addEventListener("blur", onWinBlur);

    return () => {
      window.removeEventListener("pointerup", onWinUp);
      window.removeEventListener("blur", onWinBlur);
    };
  }, [onResizeEnd]);

  const visible = show;

  return (
    <div
      className="absolute inset-0 z-50 pointer-events-none"
      aria-hidden
      style={{
        display: visible ? "block" : "none",
      }}
    >
      {/* Hit area TOP */}
      <div
        className="absolute left-0 right-0 top-0 h-3 pointer-events-auto"
        style={{ cursor: canTop ? "ns-resize" : "default", display: canTop ? "block" : "none" }}
        onPointerDown={(e) => onDown("top", e)}
        onPointerMove={onMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onMouseEnter={stop}
        onMouseMove={stop}
        onMouseLeave={stop}
      />

      {/* Hit area BOTTOM */}
      <div
        className="absolute left-0 right-0 bottom-0 h-3 pointer-events-auto"
        style={{ cursor: canBottom ? "ns-resize" : "default", display: canBottom ? "block" : "none" }}
        onPointerDown={(e) => onDown("bottom", e)}
        onPointerMove={onMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onMouseEnter={stop}
        onMouseMove={stop}
        onMouseLeave={stop}
      />

      {/* Bolitas visuales */}
      {canTop ? (
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
          <div
            className={[
              "h-2 w-2 rounded-full bg-white shadow ring-1 ring-slate-900/20",
              draggingEdge === "top" ? "scale-110" : "",
            ].join(" ")}
          />
        </div>
      ) : null}

      {canBottom ? (
        <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2">
          <div
            className={[
              "h-2 w-2 rounded-full bg-white shadow ring-1 ring-slate-900/20",
              draggingEdge === "bottom" ? "scale-110" : "",
            ].join(" ")}
          />
        </div>
      ) : null}
    </div>
  );
}
