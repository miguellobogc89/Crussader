// app/dashboard/calendar/page.tsx
"use client";

import PageShell from "@/app/components/layouts/PageShell";
import { SidebarProvider } from "@/app/components/ui/sidebar";
import CalendarShell from "@/app/components/calendar/CalendarShell";

export default function CalendarPage() {
  return (
    <SidebarProvider>
      <PageShell title="Calendario" description="" variant="full">
        <CalendarShell />
      </PageShell>
    </SidebarProvider>
  );
}
