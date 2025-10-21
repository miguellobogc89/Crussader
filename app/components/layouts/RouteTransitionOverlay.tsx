"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Muestra una barra de progreso arriba + un overlay con blur
 * cuando cambia la ruta del App Router.
 *
 * Usa una animación “optimista”: avanza hasta ~85% y termina
 * al montar la nueva ruta, con una duración mínima para evitar flicker.
 */
export default function RouteTransitionOverlay({
  scope = "container", // "container" (por defecto) = dentro del área de página; "full" = cubre toda la app
  className = "",
  minDurationMs = 450,
}: {
  scope?: "container" | "full";
  className?: string;
  minDurationMs?: number;
}) {
  const pathname = usePathname();
  const lastPathRef = useRef<string | null>(null);

  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);

  // Detecta cambios de ruta
  useEffect(() => {
    if (lastPathRef.current === null) {
      lastPathRef.current = pathname;
      return;
    }
    if (lastPathRef.current !== pathname) {
      lastPathRef.current = pathname;
      start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Simulación de progreso tipo NProgress (optimista)
  useEffect(() => {
    if (!active) return;
    let raf: number;
    let running = true;

    const tick = () => {
      setProgress((p) => {
        if (p < 0.85) {
          // incrementos decrecientes
          const delta = (1 - p) * 0.08;
          return Math.min(p + delta, 0.85);
        }
        return p;
      });
      if (running) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
    };
  }, [active]);

  // Inicia y finaliza con duración mínima
  const start = () => {
    setProgress(0.06);
    setActive(true);

    const started = performance.now();
    const finish = () => {
      const elapsed = performance.now() - started;
      const wait = Math.max(0, minDurationMs - elapsed);
      window.setTimeout(() => {
        // completa barra y oculta overlay
        setProgress(1);
        // pequeño delay para permitir la transición CSS
        window.setTimeout(() => {
          setActive(false);
          setProgress(0);
        }, 220);
      }, wait);
    };

    // Finaliza cuando el frame actual haya “pintado” la nueva ruta
    // (suficiente en la mayoría de casos con Suspense en App Router)
    requestAnimationFrame(() => {
      requestAnimationFrame(finish);
    });
  };

  const scopeClass = useMemo(
    () => (scope === "full" ? "fixed inset-0 z-[999]" : "absolute inset-0 z-50"),
    [scope]
  );

  // No renderizamos nada si está inactivo
  if (!active) return null;

  return (
    <div className={[scopeClass, className].join(" ")}>
      {/* Overlay con blur (no bloquea clics del sidebar si el scope es container) */}
      <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px] pointer-events-none" />

      {/* Barra superior de progreso */}
      <div className="absolute left-0 top-0 h-0.5 w-full bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 transition-[width,opacity] duration-200 ease-out"
          style={{
            width: `${Math.max(0, Math.min(100, progress * 100))}%`,
            opacity: progress > 0 ? 1 : 0,
          }}
        />
      </div>
    </div>
  );
}
