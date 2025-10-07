// app/components/layouts/PageShell.tsx
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

/** Barra superior mínima con botón "volver" (izq) y badge (dcha). */
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
    if (canGoBack) {
      router.back();
      return;
    }
    if (pathname !== fallbackHref) {
      router.push(fallbackHref);
    }
  };

  return (
    <div
      className={`sticky top-0 z-20 w-full bg-white ${className}`}
      role="navigation"
      aria-label="Barra de navegación superior"
    >
      {/* full-bleed para pegar la flecha al borde izquierdo */}
      <div className="px-2 sm:px-3">
        <div className="h-10 flex items-center justify-between">
          {/* Flecha volver (izquierda) */}
          <button
            type="button"
            onClick={onBack}
            disabled={disabled}
            aria-label={canGoBack ? "Volver" : "Ir al panel"}
            title={canGoBack ? "Volver" : "Ir al panel"}
            className={[
              "inline-flex h-9 w-9 items-center justify-center rounded-md",
              "hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-ring",
              "disabled:opacity-40 disabled:cursor-not-allowed",
            ].join(" ")}
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
          </button>

          {/* Badge discreta para identificar páginas con PageShell (derecha) */}
          {showShellBadge && (
            <span
              className="pointer-events-none select-none inline-flex h-6 items-center rounded-full border px-2 text-xs font-medium
                         border-emerald-200 bg-emerald-50 text-emerald-700"
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
  showShellBadge = true, // puedes ponerlo a false por página si quieres ocultarlo
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
}) {
  const router = useRouter();
  const shellRef = useRef<HTMLDivElement | null>(null);

  // Prefetch en hover / primer toque para enlaces internos dentro del shell
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

      try {
        router.prefetch(href);
      } catch {
        // best-effort
      }
    };

    el.addEventListener("mouseover", handler, { passive: true });
    el.addEventListener("touchstart", handler, { passive: true });

    return () => {
      el.removeEventListener("mouseover", handler as any);
      el.removeEventListener("touchstart", handler as any);
    };
  }, [router]);

  return (
    <div ref={shellRef} className="relative w-full">
      {/* === BARRA SUPERIOR TRANSPARENTE: flecha + badge === */}
      <TopBackBar fallbackHref={backFallback} showShellBadge={showShellBadge} />

      {/* === Spinner limitado al contenedor de página === */}
      <RouteTransitionOverlay scope="container" className="z-30" />

      {/* HEADER superior (translúcido), contenido centrado */}
      <div className="w-full bg-white backdrop-blur-sm">
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

      {/* BANDA FULL-WIDTH: blanco sólido + borde inferior */}
      {headerBand && (
        <div className="w-full bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            {headerBand}
          </div>
        </div>
      )}

      {/* BODY */}
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
