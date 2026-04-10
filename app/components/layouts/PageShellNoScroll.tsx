// app/components/layouts/PageShellNoScroll.tsx
"use client";

import { ReactNode, Suspense, useEffect, useMemo, useRef } from "react";
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

type BootstrapCompanyLite = {
  id?: string | null;
  name?: string | null;
};

type BootstrapLocationLite = {
  id?: string | null;
  companyId?: string | null;
};

type BootstrapDataLite = {
  activeCompanyResolved?: BootstrapCompanyLite | null;
  activeLocationResolved?: BootstrapLocationLite | null;
  companies?: BootstrapCompanyLite[];
  locations?: BootstrapLocationLite[];
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
  console.log("[PageShellNoScroll] bootstrap effect", {
    status,
    hasData: Boolean(bootstrapData),
  });

  void fetchFromApi();
}, [fetchFromApi, status, bootstrapData]);

  const resolvedData = useMemo(() => {
    const safeData = (bootstrapData ?? undefined) as BootstrapDataLite | undefined;

    const companies = Array.isArray(safeData?.companies) ? safeData.companies : [];
    const locations = Array.isArray(safeData?.locations) ? safeData.locations : [];

    const fallbackCompany =
      safeData?.activeCompanyResolved ??
      companies.find((item) => item?.id) ??
      null;

    const locationFromActiveId = activeLocationId
      ? locations.find((item) => item?.id === activeLocationId) ?? null
      : null;

    const locationFromCompany = fallbackCompany?.id
      ? locations.find((item) => item?.companyId === fallbackCompany.id) ?? null
      : null;

    const fallbackLocation =
      safeData?.activeLocationResolved ??
      locationFromActiveId ??
      locationFromCompany ??
      locations.find((item) => item?.id) ??
      null;

    const bootstrapCompanyId =
      fallbackCompany?.id ?? fallbackLocation?.companyId ?? null;

    const bootstrapLocationId =
      activeLocationId ?? fallbackLocation?.id ?? null;

    const companyName = fallbackCompany?.name ?? "tu negocio";

    console.log("[PageShellNoScroll resolved]", {
      status,
      bootstrapCompanyId,
      bootstrapLocationId,
      companyName,
      companiesCount: companies.length,
      locationsCount: locations.length,
    });

    return {
      bootstrapCompanyId,
      bootstrapLocationId,
      companyName,
    };
  }, [bootstrapData, activeLocationId, status]);

  const content =
    typeof children === "function" ? children(resolvedData) : children;

      console.log("[PageShellNoScroll render]", {
    status,
    hasData: Boolean(bootstrapData),
    activeLocationId,
  });

  return (
    <div
      ref={shellRef}
      className="relative flex h-full min-h-0 flex-col overflow-hidden"
    >
      <RouteTransitionOverlay scope="container" className="z-50" />

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