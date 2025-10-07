// app/components/layouts/RouteTransitionOverlay.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Overlay de transición:
 * - scope="viewport" -> fixed fullscreen (por defecto)
 * - scope="container" -> absolute al contenedor padre (que debe ser relative)
 *
 * También responde a:
 *   window.dispatchEvent(new CustomEvent("crussader:navigate-start"))
 *   window.dispatchEvent(new CustomEvent("crussader:navigate-end"))
 */
export default function RouteTransitionOverlay({
  scope = "viewport",
  className = "",
  minMs = 250,
}: {
  scope?: "viewport" | "container";
  className?: string;
  /** tiempo mínimo visible (anti-parpadeo) */
  minMs?: number;
}) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const prevPathRef = useRef(pathname);
  const timerRef = useRef<number | null>(null);

  const start = () => {
    if (timerRef.current) return;
    setVisible(true);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
    }, minMs);
  };

  const end = () => {
    const hide = () => setVisible(false);
    if (timerRef.current) {
      const t = timerRef.current;
      timerRef.current = null;
      window.setTimeout(hide, Math.max(0, minMs));
    } else {
      hide();
    }
  };

  // Cambios reales de ruta
  useEffect(() => {
    if (pathname !== prevPathRef.current) {
      start();
      const after = window.setTimeout(() => {
        end();
        prevPathRef.current = pathname;
      }, 350);
      return () => window.clearTimeout(after);
    }
  }, [pathname, minMs]);

  // Eventos manuales
  useEffect(() => {
    const onStart = () => start();
    const onEnd = () => end();
    window.addEventListener("crussader:navigate-start", onStart);
    window.addEventListener("crussader:navigate-end", onEnd);
    return () => {
      window.removeEventListener("crussader:navigate-start", onStart);
      window.removeEventListener("crussader:navigate-end", onEnd);
    };
  }, []);

  if (!visible) return null;

  const positioning =
    scope === "viewport"
      ? "fixed inset-0 z-[60]"
      : "absolute inset-0 z-[30]"; // menor que sidebar, mayor que el contenido

  return (
    <div
      aria-live="polite"
      className={`pointer-events-none ${positioning} bg-background/40 backdrop-blur-sm transition-opacity ${className}`}
    >
      <div className="flex h-full w-full items-center justify-center">
        <Spinner />
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div
      role="status"
      aria-label="Cargando"
      className="inline-flex h-10 w-10 animate-spin items-center justify-center rounded-full border-2 border-muted-foreground/40 border-t-foreground"
    />
  );
}
