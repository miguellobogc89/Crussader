// app/components/layouts/RouteTransitionOverlay.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Spinner from "@/app/components/crussader/UX/Spinner";

/**
 * Muestra una barra de progreso arriba + un overlay con blur
 * cuando se dispara un evento global:
 * - "crs:navigation-start"
 * - "crs:company-switch-start"
 */
export default function RouteTransitionOverlay({
  scope = "container",
  className = "",
  minDurationMs = 450,
}: {
  scope?: "container" | "full";
  className?: string;
  minDurationMs?: number;
}) {
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);

  const start = () => {
    setProgress((prev) => {
      if (!active && prev === 0) return 0.06;
      return prev;
    });
    if (active) return;
    setActive(true);

    const started = performance.now();
    const finish = () => {
      const elapsed = performance.now() - started;
      const wait = Math.max(0, minDurationMs - elapsed);
      window.setTimeout(() => {
        setProgress(1);
        window.setTimeout(() => {
          setActive(false);
          setProgress(0);
        }, 220);
      }, wait);
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(finish);
    });
  };

  // 🔹 Escucha eventos globales de inicio
  useEffect(() => {
    const handler = () => start();

    if (typeof window !== "undefined") {
      window.addEventListener("crs:navigation-start", handler);
      window.addEventListener("crs:company-switch-start", handler);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("crs:navigation-start", handler);
        window.removeEventListener("crs:company-switch-start", handler);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Simulación de progreso tipo NProgress (optimista)
  useEffect(() => {
    if (!active) return;
    let raf: number;
    let running = true;

    const tick = () => {
      setProgress((p) => {
        if (p < 0.85) {
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

  const scopeClass = useMemo(
    () => (scope === "full" ? "fixed inset-0 z-[999]" : "absolute inset-0 z-50"),
    [scope],
  );

  if (!active) return null;

  return (
    <div className={[scopeClass, className].join(" ")}>
      {/* Overlay con blur + oscurecido sutil */}
      <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-sm pointer-events-none" />

      {/* Spinner centrado (solo en el lienzo) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <Spinner size={46} speed={2.2} color="#34d399" centered />
      </div>

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
