//app/components/layouts/PageShellNoScroll.tsx
"use client";

import { ReactNode, Suspense, useEffect, useRef } from "react";
import RouteTransitionOverlay from "./RouteTransitionOverlay";
import PageHeader from "./PageHeader";
import {
  useActiveLocationId,
  useBootstrapData,
  useBootstrapStatus,
  useBootstrapStore,
} from "@/app/providers/bootstrap-store";
import Spinner from "@/app/components/crussader/UX/Spinner";

type ShellRenderData = {
  bootstrapCompanyId: string | null;
  bootstrapLocationId: string | null;
  companyName: string;
};

type Props = {
  title: string;
  description?: string;
  toolbar?: ReactNode;
  headerBand?: ReactNode;
  children: ReactNode | ((data: ShellRenderData) => ReactNode);
  hideHeaderArea?: boolean;
};

export default function PageShellNoScroll({
  title,
  description,
  toolbar,
  headerBand,
  children,
  hideHeaderArea = false,
}: Props) {
  const shellRef = useRef<HTMLDivElement | null>(null);

  const status = useBootstrapStatus();
  const bootstrapData = useBootstrapData();
  const activeLocationId = useActiveLocationId();
  const fetchFromApi = useBootstrapStore((s) => s.fetchFromApi);

  useEffect(() => {
    if (status === "idle") {
      fetchFromApi();
    }
  }, [status, fetchFromApi]);

  const bootstrapCompanyId = bootstrapData?.activeCompanyResolved?.id ?? null;
  const bootstrapLocationId = activeLocationId ?? null;
  const companyName = bootstrapData?.activeCompanyResolved?.name ?? "tu negocio";

  const content =
    typeof children === "function"
      ? children({
          bootstrapCompanyId,
          bootstrapLocationId,
          companyName,
        })
      : children;

  return (
    <div
      ref={shellRef}
      className="relative flex h-full min-h-0 flex-col overflow-hidden"
    >
      <RouteTransitionOverlay scope="container" className="z-50" />

      {/* HEADER → NO crece */}
      {!hideHeaderArea && (
        <div className="shrink-0">
          <PageHeader title={title} description={description} rightSlot={toolbar} />
        </div>
      )}

      {headerBand && (
        <div className="shrink-0 border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {headerBand}
          </div>
        </div>
      )}

      {/* BODY → AQUÍ está la clave */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center">
              <Spinner centered size={48} color="#6366f1" />
            </div>
          }
        >
          <div className="flex h-full min-h-0 flex-col overflow-hidden">
            {content}
          </div>
        </Suspense>
      </div>
    </div>
  );
}