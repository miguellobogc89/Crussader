"use client";

import { ReactNode, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import PageHeader from "./PageHeader";
import PageBody from "./PageBody";
import RouteTransitionOverlay from "./RouteTransitionOverlay";

function BodySkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-1/3 animate-pulse rounded bg-muted" />
      <div className="h-24 w-full animate-pulse rounded bg-muted" />
      <div className="h-64 w-full animate-pulse rounded bg-muted" />
    </div>
  );
}

/** Barra superior superpuesta (overlay): flecha + badge. */
function TopBackBar({
  fallbackHref = "/dashboard",
  className = "",
  showShellBadge = true,
}: {
  fallbackHref?: string;
  className?: string;
  showShellBadge?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    setCanGoBack(typeof window !== "undefined" && window.history.length > 1);
  }, [pathname]);

  const disabled = useMemo(
    () => pathname === fallbackHref && !canGoBack,
    [pathname, fallbackHref, canGoBack]
  );

  const onBack = () => {
    if (canGoBack) return router.back();
    if (pathname !== fallbackHref) router.push(fallbackHref);
  };

  return (
    <div
      className={[
        // overlay absoluto, no ocupa alto
        "pointer-events-none absolute inset-x-0 top-0 z-40",
        className,
      ].join(" ")}
      role="navigation"
      aria-label="Barra de navegación superior"
    >
      <div className="px-2 sm:px-3">
        <div className="h-10 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            disabled={disabled}
            aria-label={canGoBack ? "Volver" : "Ir al panel"}
            title={canGoBack ? "Volver" : "Ir al panel"}
            className={[
              "pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-md",
              "bg-white/80 backdrop-blur shadow-sm",
              "hover:bg-white focus:outline-none focus:ring-2 focus:ring-ring",
              "disabled:opacity-40 disabled:cursor-not-allowed",
            ].join(" ")}
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
          </button>

          {showShellBadge && (
            <span
              className="pointer-events-none select-none inline-flex h-6 items-center rounded-full border px-2 text-xs font-medium
                         border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm"
              title="Esta página usa PageShell"
              aria-label="Usa PageShell"
            >
              Shell Activo
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PageShell({
  title,
  description,
  breadcrumbs,
  actions,
  toolbar,
  headerBand,
  children,
  variant = "default",
  backFallback = "/dashboard",
  showShellBadge = true,
  /** ➕ permite ocultar la cabecera grande del shell */
  hideHeaderArea = false,
}: {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: ReactNode;
  toolbar?: ReactNode;
  headerBand?: ReactNode;
  children: ReactNode;
  variant?: "default" | "full" | "narrow";
  backFallback?: string;
  showShellBadge?: boolean;
  hideHeaderArea?: boolean;
}) {
  const router = useRouter();
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
      if ((a as any).__prefetched) return;
      (a as any).__prefetched = true;
      try { router.prefetch(href); } catch {}
    };
    el.addEventListener("mouseover", handler, { passive: true });
    el.addEventListener("touchstart", handler, { passive: true });
    return () => {
      el.removeEventListener("mouseover", handler as any);
      el.removeEventListener("touchstart", handler as any);
    };
  }, [router]);

  return (
    <div ref={shellRef} className="relative w-full h-full">
      <TopBackBar fallbackHref={backFallback} showShellBadge={showShellBadge} />

      <RouteTransitionOverlay scope="container" className="z-50" />

      {!hideHeaderArea && (
        <div className="w-full bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <PageHeader
              title={title}
              description={description}
              breadcrumbs={breadcrumbs}
              actions={actions}
            />
            {toolbar && <div className="mt-4">{toolbar}</div>}
          </div>
        </div>
      )}

      {headerBand && (
        <div className="w-full bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            {headerBand}
          </div>
        </div>
      )}

      <Suspense
        fallback={
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <BodySkeleton />
          </div>
        }
      >
        <PageBody variant={variant}>{children}</PageBody>
      </Suspense>
    </div>
  );
}
