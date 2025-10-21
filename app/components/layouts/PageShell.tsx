// app/components/layouts/PageShell.tsx
"use client";

import { ReactNode, Suspense, useEffect, useRef } from "react";
import RouteTransitionOverlay from "./RouteTransitionOverlay";
import PageBody from "./PageBody";
import Breadcrumbs from "@/app/components/crussader/navigation/Breadcrumbs";
import PageTitle from "./PageTitle";

export default function PageShell({
  title,
  titleIconName, // <- la page decide el icono por nombre
  description,
  toolbar,
  headerBand,
  children,
  variant = "default",
  hideHeaderArea = false,
}: {
  title: string;
  titleIconName?: React.ComponentProps<typeof PageTitle>["iconName"]; // <- tip sacado del propio PageTitle
  description?: string;
  toolbar?: ReactNode;
  headerBand?: ReactNode;
  children: ReactNode;
  variant?: "default" | "full" | "narrow";
  hideHeaderArea?: boolean;
}) {
  const shellRef = useRef<HTMLDivElement | null>(null);

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

  return (
    <div ref={shellRef} className="relative w-full h-full">
      <RouteTransitionOverlay scope="container" className="z-50" />

      {/* ===== HEADER ===== */}
      {!hideHeaderArea && (
        <div className="w-full bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Breadcrumbs con iconos (gris) */}
            <div className="mb-3">
              <Breadcrumbs rootHref="/dashboard" />
            </div>

            {/* Título con icono grande y gradiente (la page decide iconName y title) */}
            <PageTitle
              title={title}
              subtitle={description || undefined}
              iconName={titleIconName}
              size="lg"
              gradient="from-indigo-600 via-violet-600 to-fuchsia-600"
            />

            {/* Toolbar justo bajo el título */}
            {toolbar ? <div className="mt-4">{toolbar}</div> : null}
          </div>
        </div>
      )}

      {/* ===== Banda opcional ===== */}
      {headerBand && (
        <div className="w-full bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">{headerBand}</div>
        </div>
      )}

      {/* ===== BODY ===== */}
      <Suspense
        fallback={
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="space-y-4">
              <div className="h-10 w-1/3 animate-pulse rounded bg-muted" />
              <div className="h-24 w-full animate-pulse rounded bg-muted" />
              <div className="h-64 w-full animate-pulse rounded bg-muted" />
            </div>
          </div>
        }
      >
        <PageBody variant={variant}>{children}</PageBody>
      </Suspense>
    </div>
  );
}
