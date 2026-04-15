// app/components/layouts/PageShellNoScroll.tsx
"use client";

import { ReactNode, Suspense, useRef } from "react";
import RouteTransitionOverlay from "./RouteTransitionOverlay";
import PageHeader from "./PageHeader";
import {
  useActiveLocationId,
  useActiveLocationResolved,
  useActiveCompanyResolved,
  useSessionContext,
} from "@/app/providers/bootstrap-store";
import Spinner from "@/app/components/crussader/UX/Spinner";
import type PageTitle from "./PageTitle";

type ShellRenderData = {
  bootstrapCompanyId: string | null;
  bootstrapLocationId: string | null;
  companyName: string;
};

type Props = {
  title: string;
  titleIconName?: React.ComponentProps<typeof PageTitle>["iconName"];
  description?: string;
  toolbar?: ReactNode;
  headerBand?: ReactNode;
  children: ReactNode | ((data: ShellRenderData) => ReactNode);
  hideHeaderArea?: boolean;
};

export default function PageShellNoScroll({
  title,
  titleIconName,
  description,
  toolbar,
  headerBand,
  children,
  hideHeaderArea = false,
}: Props) {
  const shellRef = useRef<HTMLDivElement | null>(null);

  const sessionContext = useSessionContext();
  const activeCompanyResolved = useActiveCompanyResolved();
  const activeLocationResolved = useActiveLocationResolved();
  const activeLocationId = useActiveLocationId();

  const resolvedData: ShellRenderData = {
    bootstrapCompanyId:
      sessionContext?.companyId ?? activeCompanyResolved?.id ?? null,
    bootstrapLocationId:
      activeLocationId ??
      sessionContext?.locationId ??
      activeLocationResolved?.id ??
      null,
    companyName: activeCompanyResolved?.name ?? "tu negocio",
  };

  const content =
    typeof children === "function" ? children(resolvedData) : children;

  return (
<div
  ref={shellRef}
  className="relative flex h-[calc(100vh-var(--dashboard-header-offset,0px))] min-h-0 flex-col overflow-hidden"
>
      <RouteTransitionOverlay scope="container" className="z-50" />

      {!hideHeaderArea ? (
        <div className="shrink-0">
          <PageHeader
            title={title}
            titleIconName={titleIconName}
            description={description}
            rightSlot={toolbar}
          />
        </div>
      ) : null}

      {headerBand ? (
        <div className="shrink-0 border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {headerBand}
          </div>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1">
        <Suspense
          fallback={
            <div className="flex h-full w-full items-center justify-center">
              <Spinner centered size={48} color="#6366f1" />
            </div>
          }
        >
          <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
            {content}
          </div>
        </Suspense>
      </div>
    </div>
  );
}