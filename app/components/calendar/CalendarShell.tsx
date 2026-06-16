// app/components/calendar/CalendarShell.tsx
"use client";

import { useState } from "react";
import CalendarView from "@/app/components/calendar/calendar/CalendarView";
import CalendarSidebar from "@/app/components/calendar/calendar/sidebar/CalendarSidebar";

type Props = {
  locationId: string | null;
  companyId: string | null;
};

export default function CalendarShell({ locationId, companyId }: Props) {
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [visibleGoogleCalendarIds, setVisibleGoogleCalendarIds] = useState<
    string[]
  >([]);

  if (!locationId) {
    return null;
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 overflow-hidden">
<aside className="hidden h-full w-[240px] shrink-0 border-r border-slate-200 bg-white lg:block xl2:w-[300px]">        <CalendarSidebar
          companyId={companyId}
          locationId={locationId}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          visibleGoogleCalendarIds={visibleGoogleCalendarIds}
          onChangeVisibleGoogleCalendarIds={setVisibleGoogleCalendarIds}
        />
      </aside>

      <main className="h-full min-h-0 w-0 flex-1 overflow-hidden bg-white">
        <CalendarView
          locationId={locationId}
          companyId={companyId}
          selectedDate={selectedDate}
          onChangeSelectedDate={setSelectedDate}
          onCellClick={setSelectedCellId}
          selectedCellId={selectedCellId}
          visibleGoogleCalendarIds={visibleGoogleCalendarIds}
        />
      </main>
    </div>
  );
}