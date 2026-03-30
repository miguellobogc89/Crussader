// app/components/layouts/PageShell.tsx
"use client";

import { ReactNode, Suspense, useEffect, useRef } from "react";
import RouteTransitionOverlay from "./RouteTransitionOverlay";
import PageBody from "./PageBody";
import PageHeader from "./PageHeader";
import {
  useBootstrapData,
  useBootstrapStatus,
  useBootstrapStore,
} from "@/app/providers/bootstrap-store";
import Spinner from "@/app/components/crussader/UX/Spinner";

export default function PageShell({
  title,
  titleIconName,
  description,
  toolbar,
  headerBand,
  children,
  variant = "default",
  hideHeaderArea = false,

  // 👇 NUEVO
  isLoading = false,
  loadingLabel,
}: {
  title: string;
  titleIconName?: React.ComponentProps<
    typeof import("./PageTitle").default
  >["iconName"];
  description?: string;
  toolbar?: ReactNode;
  headerBand?: ReactNode;
  children: ReactNode;
  variant?: "default" | "full" | "narrow";
  hideHeaderArea?: boolean;

  /** Si true, se muestra un overlay de carga y NO se renderiza el body aún */
  isLoading?: boolean;
  /** Texto opcional debajo del spinner, tipo "Cargando datos de la empresa..." */
  loadingLabel?: string;
}) {
  const shellRef = useRef<HTMLDivElement | null>(null);

  const status = useBootstrapStatus();
  const bootstrapData = useBootstrapData();
  const fetchFromApi = useBootstrapStore((s) => s.fetchFromApi);

  // Dispara la carga de bootstrap cuando el store está idle
  useEffect(() => {
    if (status === "idle") {
      console.log("[BOOTSTRAP] status idle → llamando fetchFromApi()");
      fetchFromApi();
    }
  }, [status, fetchFromApi]);

  // Debug del estado global de bootstrap
  useEffect(() => {
    console.log("[BOOTSTRAP STATE]", {
      status,
      data: bootstrapData,
    });
  }, [status, bootstrapData]);

  // Prefetch de enlaces internos al hacer hover/touch
  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    const handler = (evt: Event) => {
      const target = evt.target as HTMLElement | null;
      const a = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute("href") || "";
      if (!href.startsWith("/")) return;
      try {
        // @ts-ignore
        window?.next?.router?.prefetch?.(href);
      } catch {}
    };
    el.addEventListener("mouseover", handler, { passive: true });
    el.addEventListener("touchstart", handler, { passive: true });
    return () => {
      el.removeEventListener("mouseover", handler as any);
      el.removeEventListener("touchstart", handler as any);
    };
  }, []);

  // ─────────────────────────────────────────────
  //  MODO CARGA GLOBAL (antes de mostrar el body)
  // ─────────────────────────────────────────────
  if (isLoading) {
    return (
        <div ref={shellRef} className="relative w-full h-full">
          <RouteTransitionOverlay scope="container" className="z-50" />

          {!hideHeaderArea && (
            <PageHeader
              title={title}
              description={description}
              titleIconName={titleIconName}
              rightSlot={toolbar}
            />
          )}

          {headerBand && (
            <div className="w-full bg-white border-b border-slate-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {headerBand}
              </div>
            </div>
          )}

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="h-[40vh] flex flex-col items-center justify-center gap-4">
              <Spinner centered size={48} color="#6366f1" />
              {loadingLabel && (
                <p className="text-sm text-slate-500 text-center">
                  {loadingLabel}
                </p>
              )}
            </div>
          </div>
        </div>
    );
  }

  // ─────────────────────────────────────────────
  //  MODO NORMAL (contenido ya listo)
  // ─────────────────────────────────────────────
  return (
      <div ref={shellRef} className="relative w-full h-full">
        <RouteTransitionOverlay scope="container" className="z-50" />

        {!hideHeaderArea && (
          <PageHeader
            title={title}
            description={description}
            titleIconName={titleIconName}
            rightSlot={toolbar}
          />
        )}

        {headerBand && (
          <div className="w-full bg-white border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {headerBand}
            </div>
          </div>
        )}

        <Suspense
          fallback={
            <div
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
              aria-busy="true"
              aria-live="polite"
            >
              <div className="h-[40vh] flex items-center justify-center">
                <Spinner centered size={48} color="#6366f1" />
              </div>
            </div>
          }
        >
          <PageBody variant={variant}>{children}</PageBody>
        </Suspense>
      </div>
  );
}
