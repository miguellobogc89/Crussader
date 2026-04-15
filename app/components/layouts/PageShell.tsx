// app/components/layouts/PageShell.tsx
"use client";

import { ReactNode, Suspense, useRef } from "react";
import RouteTransitionOverlay from "./RouteTransitionOverlay";
import PageBody from "./PageBody";
import PageHeader from "./PageHeader";
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
  isLoading?: boolean;
  loadingLabel?: string;
}) {
  const shellRef = useRef<HTMLDivElement | null>(null);

  if (isLoading) {
    return (
      <div ref={shellRef} className="relative flex h-full min-h-0 w-full flex-col overflow-hidden">
        <RouteTransitionOverlay scope="container" className="z-50" />

        {!hideHeaderArea && (
          <div className="shrink-0">
            <PageHeader
              title={title}
              description={description}
              titleIconName={titleIconName}
              rightSlot={toolbar}
            />
          </div>
        )}

        {headerBand && (
          <div className="shrink-0 border-b border-slate-200 bg-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {headerBand}
            </div>
          </div>
        )}

        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center gap-4">
            <Spinner centered size={48} color="#6366f1" />
            {loadingLabel && (
              <p className="text-center text-sm text-slate-500">
                {loadingLabel}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={shellRef} className="relative flex h-full min-h-0 w-full flex-col overflow-hidden">
      <RouteTransitionOverlay scope="container" className="z-50" />

      {!hideHeaderArea && (
        <div className="shrink-0">
          <PageHeader
            title={title}
            description={description}
            titleIconName={titleIconName}
            rightSlot={toolbar}
          />
        </div>
      )}

      {headerBand && (
        <div className="shrink-0 border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {headerBand}
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-hidden">
        <Suspense
          fallback={
            <div
              className="flex h-full items-center justify-center"
              aria-busy="true"
              aria-live="polite"
            >
              <Spinner centered size={48} color="#6366f1" />
            </div>
          }
        >
          <PageBody variant={variant}>{children}</PageBody>
        </Suspense>
      </div>
    </div>
  );
}