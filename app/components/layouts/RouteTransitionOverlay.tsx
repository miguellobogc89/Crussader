"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Overlay de transición de ruta:
 * - Muestra un spinner al cambiar pathname
 * - También responde a eventos manuales:
 *   window.dispatchEvent(new CustomEvent("crussader:navigate-start"))
 *   window.dispatchEvent(new CustomEvent("crussader:navigate-end"))
 */
export default function RouteTransitionOverlay() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const prevPathRef = useRef(pathname);
  const timerRef = useRef<number | null>(null);

  // Mínimo tiempo visible para evitar parpadeos
  const MIN_MS = 250;

  const start = () => {
    if (timerRef.current) return; // ya activo
    setVisible(true);
    // guardamos un timer para asegurar mínimo tiempo
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
    }, MIN_MS);
  };

  const end = () => {
    const hide = () => setVisible(false);
    if (timerRef.current) {
      // si no pasó el mínimo, esperamos a que termine
      const t = timerRef.current;
      timerRef.current = null;
      window.setTimeout(hide, Math.max(0, MIN_MS));
    } else {
      hide();
    }
  };

  // Reacciona a cambios reales de ruta
  useEffect(() => {
    if (pathname !== prevPathRef.current) {
      start();
      // pequeño delay para dejar que la nueva ruta hydrate
      const after = window.setTimeout(() => {
        end();
        prevPathRef.current = pathname;
      }, 350);
      return () => window.clearTimeout(after);
    }
  }, [pathname]);

  // Eventos manuales (ej. desde Sidebar onClick)
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

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-0 z-[60] bg-background/40 backdrop-blur-sm transition-opacity"
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
