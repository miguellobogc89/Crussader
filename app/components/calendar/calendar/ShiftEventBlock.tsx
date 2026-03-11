// app/components/calendar/calendar/ShiftEventBlock.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { User } from "lucide-react";
import ShiftEventResizeOverlay from "@/app/components/calendar/calendar/ShiftEventResizeOverlay";

type ResizeEdge = "top" | "bottom";

type Props = {
  top: number;
  height: number;

  leftPct: number;
  widthPct: number;

  title: string;
  subtitle?: string | null;

  color?: string | null;
  selected?: boolean;

  lines?: string[];

  allowResizeTop?: boolean;
  allowResizeBottom?: boolean;

  onClick?: () => void;

  onResizeStart?: (edge: ResizeEdge) => void;
  onResizeMove?: (edge: ResizeEdge, deltaPx: number) => void;
  onResizeEnd?: (edge: ResizeEdge) => void;
};

function normalizeHexColor(input: string | null | undefined) {
  if (!input) return null;
  const c = String(input).trim();
  if (c.startsWith("#") && c.length === 7) return c;
  if (!c.startsWith("#") && c.length === 6) return `#${c}`;
  return null;
}

function isTouchLike() {
  if (typeof window === "undefined") return false;
  if ("ontouchstart" in window) return true;
  if (navigator && navigator.maxTouchPoints) return navigator.maxTouchPoints > 0;
  return false;
}

const GLOBAL_POPOVER_EVENT = "crussader:shift-popover-open";

export default function ShiftEventBlock({
  top,
  height,
  leftPct,
  widthPct,
  title,
  subtitle,
  color,
  lines,
  onClick,
  selected,

  allowResizeTop,
  allowResizeBottom,

  onResizeStart,
  onResizeMove,
  onResizeEnd,
}: Props) {
  const [isHover, setIsHover] = useState(false);
  const [showPopover, setShowPopover] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const hoverTimerRef = useRef<number | null>(null);
  const popoverOpenRef = useRef(false);

  const instanceIdRef = useRef<string>("");
  if (instanceIdRef.current.length === 0) {
    const w = typeof window !== "undefined" ? (window as any) : null;
    const canUUID = w && w.crypto && typeof w.crypto.randomUUID === "function";
    if (canUUID) instanceIdRef.current = w.crypto.randomUUID();
    else instanceIdRef.current = `${Date.now()}-${Math.random()}`;
  }

  const touchMode = useMemo(() => isTouchLike(), []);

  const GAP_PX = 6;
  const safeColor = normalizeHexColor(color);

  const topPx = top + GAP_PX / 2;
  const heightPx = Math.max(0, height - GAP_PX);

  const subtitleText =
    subtitle && String(subtitle).trim().length > 0 ? String(subtitle).trim() : null;

  const safeLines = Array.isArray(lines) ? lines : [];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function onGlobalOpen(ev: Event) {
      const ce = ev as CustomEvent<{ id?: string }>;
      const otherId = ce && ce.detail ? ce.detail.id : null;
      const myId = instanceIdRef.current;

      if (!otherId) return;
      if (otherId === myId) return;

      closePopover();
      setIsHover(false);
    }

    if (typeof window === "undefined") return;

    window.addEventListener(GLOBAL_POPOVER_EVENT, onGlobalOpen as EventListener);

    return () => {
      window.removeEventListener(GLOBAL_POPOVER_EVENT, onGlobalOpen as EventListener);

      const w = window as any;
      if (w.__cruShiftPopoverActiveId === instanceIdRef.current) {
        w.__cruShiftPopoverActiveId = null;
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
    };
  }, []);

  function stop(e: React.SyntheticEvent) {
    e.stopPropagation();
  }

  function announceOpen() {
    if (typeof window === "undefined") return;

    const w = window as any;
    w.__cruShiftPopoverActiveId = instanceIdRef.current;

    window.dispatchEvent(
      new CustomEvent(GLOBAL_POPOVER_EVENT, {
        detail: { id: instanceIdRef.current },
      })
    );
  }

  function openPopoverDelayed() {
    if (touchMode) return;

    announceOpen();

    if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);

    hoverTimerRef.current = window.setTimeout(() => {
      popoverOpenRef.current = true;
      setShowPopover(true);
      announceOpen();
    }, 500);
  }

  function closePopover() {
    if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = null;
    popoverOpenRef.current = false;
    setShowPopover(false);
  }

  const borderColor = isHover
    ? safeColor
      ? `${safeColor}AA`
      : "rgba(15,23,42,0.30)"
    : safeColor
      ? `${safeColor}55`
      : "rgba(15,23,42,0.10)";

  const popoverStyle = useMemo(() => {
    const OFFSET_X = 14;
    const OFFSET_Y = 14;

    const maxW = 320;
    const x = mousePos.x + OFFSET_X;
    const y = mousePos.y + OFFSET_Y;

    const vw = typeof window !== "undefined" ? window.innerWidth : 9999;
    const vh = typeof window !== "undefined" ? window.innerHeight : 9999;

    const clampedX = Math.min(x, vw - maxW - 12);
    const clampedY = Math.min(y, vh - 24);

    return {
      left: clampedX,
      top: clampedY,
      width: maxW,
    } as const;
  }, [mousePos]);

  function handleClick(e: React.SyntheticEvent) {
    stop(e);

    if (touchMode) {
      if (popoverOpenRef.current) {
        closePopover();
      } else {
        announceOpen();
        popoverOpenRef.current = true;
        setShowPopover(true);
      }
    }

    if (onClick) onClick();
  }

  useEffect(() => {
    if (!touchMode) return;
    if (!showPopover) return;

    function onDocDown() {
      closePopover();
    }

    document.addEventListener("pointerdown", onDocDown);
    return () => document.removeEventListener("pointerdown", onDocDown);
  }, [touchMode, showPopover]);

  return (
    <>
      <button
        type="button"
        // ✅ quitamos overflow-hidden para que las bolitas puedan sobresalir sin recortarse
        className="absolute rounded-lg px-2 py-1 text-xs shadow-sm text-left pointer-events-auto"
        style={{
          top: topPx,
          height: heightPx,
          left: `calc(${leftPct}% + ${GAP_PX / 2}px)`,
          width: `calc(${widthPct}% - ${GAP_PX}px)`,

          backgroundColor: safeColor ? `${safeColor}22` : "rgba(15,23,42,0.05)",
          border: `1px solid ${borderColor}`,
          boxShadow: isHover ? "0 0 0 2px rgba(15,23,42,0.08)" : undefined,
          cursor: "pointer",
          transition: "background-color 1.2s ease, box-shadow 1.2s ease, border-color 1.2s ease",
        }}
        onMouseEnter={(e) => {
          stop(e);
          setIsHover(true);
          openPopoverDelayed();
        }}
        onMouseLeave={(e) => {
          stop(e);
          setIsHover(false);
          if (!touchMode) closePopover();
        }}
        onMouseMove={(e) => {
          stop(e);
          const me = e as any;
          setMousePos({ x: me.clientX ?? 0, y: me.clientY ?? 0 });
        }}
        onPointerEnter={stop}
        onPointerMove={(e) => {
          stop(e);
          const pe = e as any;
          if (typeof pe.clientX === "number" && typeof pe.clientY === "number") {
            setMousePos({ x: pe.clientX, y: pe.clientY });
          }
        }}
        onPointerDown={stop}
        onClick={handleClick}
      >
        {/* ✅ envolvemos el contenido “recortable” en un contenedor con overflow-hidden */}
        <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none" />

        {/* contenido normal (por encima del recorte) */}
        <div className="absolute inset-0 px-2 py-1 pointer-events-none">
          {/* TAG arriba izquierda */}
          <div className="absolute left-2 top-2 max-w-[calc(100%-16px)]">
            <div
              className="inline-flex max-w-full items-center rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-900"
              style={{
                backgroundColor: safeColor ? `${safeColor}33` : "rgba(255,255,255,0.7)",
              }}
              title={title}
            >
              <span className="truncate">{title}</span>
            </div>
          </div>

          {/* Icono + número */}
          {subtitleText ? (
            <div className="absolute left-2 top-9 flex items-center gap-1 text-[11px] font-semibold text-slate-900/80">
              <User size={12} />
              <span className="leading-none">{subtitleText}</span>
            </div>
          ) : null}
        </div>

        {/* ✅ overlay resize encima de todo, sin recorte */}
        <ShiftEventResizeOverlay
          show={Boolean(selected) || isHover}
          allowTop={allowResizeTop}
          allowBottom={allowResizeBottom}
          onResizeStart={onResizeStart}
          onResizeMove={onResizeMove}
          onResizeEnd={onResizeEnd}
        />
      </button>

      {mounted && showPopover && safeLines.length > 0
        ? createPortal(
            <div className="fixed z-[9999] pointer-events-none" style={popoverStyle}>
              <div
                className="rounded-xl border border-slate-900/15 shadow-xl px-3 py-2 text-xs text-slate-900"
                style={{
                  backgroundColor: "rgba(255,255,255,0.95)",
                  backdropFilter: "blur(6px)",
                }}
              >
                <div className="font-semibold truncate">{title}</div>

                {subtitleText ? (
                  <div className="mt-1 text-[11px] font-semibold text-slate-900/80">
                    {subtitleText}
                  </div>
                ) : null}

                <div className="mt-2 space-y-1">
                  {safeLines.map((t, i) => (
                    <div key={`${t}-${i}`} className="truncate text-slate-900/85">
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
