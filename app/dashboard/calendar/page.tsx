// app/dashboard/calendar/page.tsx
"use client";

import { Suspense } from "react";
import { SidebarProvider } from "@/app/components/ui/sidebar";
import CalendarShell from "@/app/components/calendar/CalendarShell";
import RouteTransitionOverlay from "@/app/components/layouts/RouteTransitionOverlay";
import PageHeader from "@/app/components/layouts/PageHeader";
import Spinner from "@/app/components/crussader/UX/Spinner";
import {
  useActiveLocationId,
  useActiveLocationResolved,
} from "@/app/providers/bootstrap-store";

export default function CalendarPage() {
  const activeLocationResolved = useActiveLocationResolved();
  const activeLocationId = useActiveLocationId();

  const bootstrapLocationId =
    activeLocationId ?? activeLocationResolved?.id ?? null;

  return (
    <SidebarProvider>
      <div className="relative flex h-[calc(100vh-var(--dashboard-header-offset,0px))] min-h-0 w-full flex-col overflow-hidden">
        <RouteTransitionOverlay scope="container" className="z-50" />

        <div className="shrink-0">
          <PageHeader
            title="Calendario"
            titleIconName="Calendar"
            description="Gestiona citas, empleados y sincronización."
          />
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center">
                <Spinner centered size={48} color="#6366f1" />
              </div>
            }
          >
            <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
              <CalendarShell locationId={bootstrapLocationId} />
            </div>
          </Suspense>
        </div>
      </div>
    </SidebarProvider>
  );
}