// app/dashboard/calendar/page.tsx
"use client";

import { SidebarProvider } from "@/app/components/ui/sidebar";
import PageShellNoScroll from "@/app/components/layouts/PageShellNoScroll";
import CalendarShell from "@/app/components/calendar/CalendarShell";

export default function CalendarPage() {
  return (
    <SidebarProvider>
      <PageShellNoScroll title="Calendario" description="">
        {({ bootstrapLocationId }) => (
          <CalendarShell locationId={bootstrapLocationId} />
        )}
      </PageShellNoScroll>
    </SidebarProvider>
  );
}