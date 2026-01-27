// app/components/calendar/CalendarShell.tsx
"use client";

import ResourceView from "@/app/components/calendar/resources/ResourceView";
import CalendarView from "@/app/components/calendar/CalendarOnly/CalendarView";
// import AppointmentView from "@/app/components/calendar/AppointmentView"; // (cuando exista)

type Props = {
  workspaceHeight?: string;
  showRightPanel?: boolean;
};

export default function CalendarShell({
  workspaceHeight = "78vh",
  showRightPanel = false,
}: Props) {
  return (
    <div className="min-h-0 overflow-hidden" style={{ height: workspaceHeight }}>
      <div className="flex h-full gap-4 overflow-hidden">
        {/* Left */}
        <div className="shrink-0 h-full">
          <ResourceView />
        </div>

        {/* Center */}
        <div className="flex-1 min-w-0 h-full overflow-hidden flex flex-col">
          <CalendarView />
        </div>

        {/* Right (opcional, más adelante) */}
        {showRightPanel ? (
          <div className="shrink-0 h-full">
            {/* <AppointmentView /> */}
          </div>
        ) : null}
      </div>
    </div>
  );
}
