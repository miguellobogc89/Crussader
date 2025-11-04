"use client";

import { ReactNode, Suspense, useEffect, useRef } from "react";
import { SessionProvider } from "next-auth/react";
import RouteTransitionOverlay from "./RouteTransitionOverlay";
import PageBody from "./PageBody";
import PageHeader from "./PageHeader";
import Spinner from "@/app/components/crussader/UX/Spinner"; // ⬅️ NUEVO

export default function PageShell({
  title,
  titleIconName,
  description,
  toolbar,
  headerBand,
  children,
  variant = "default",
  hideHeaderArea = false,
}: {
  title: string;
  titleIconName?: React.ComponentProps<typeof import("./PageTitle").default>["iconName"];
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
    <SessionProvider refetchOnWindowFocus={false}>
      <div ref={shellRef} className="relative w-full h-full">
        <RouteTransitionOverlay scope="container" className="z-50" />

        {/* ===== HEADER ===== */}
        {!hideHeaderArea && (
          <>
            <PageHeader
              title={title}
              description={description}
              titleIconName={titleIconName}
            />

            {toolbar ? (
              <div className="w-full bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                  {toolbar}
                </div>
              </div>
            ) : null}
          </>
        )}

        {/* ===== BANDA OPCIONAL ===== */}
        {headerBand && (
          <div className="w-full bg-white border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {headerBand}
            </div>
          </div>
        )}

        {/* ===== BODY ===== */}
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
    </SessionProvider>
  );
}
