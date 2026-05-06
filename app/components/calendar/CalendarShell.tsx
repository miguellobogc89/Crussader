// app/components/calendar/CalendarShell.tsx
"use client";

import { useState } from "react";
import CalendarView from "@/app/components/calendar/calendar/CalendarView";
import StandardCard from "@/app/components/crussader/UX/standardCard";

type Props = {
  locationId: string | null;
};

export default function CalendarShell({ locationId }: Props) {
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);

  if (!locationId) {
    return null;
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden px-3 pb-3 pt-1 lg:px-4 lg:pb-4 xl:px-5 xl:pb-5 xl2:px-6 xl2:pb-6 xl2:pt-6">
      <div className="min-h-0 flex-1 overflow-hidden">
        <StandardCard className="flex h-full min-h-0 flex-col overflow-hidden">
          <CalendarView
            locationId={locationId}
            onCellClick={setSelectedCellId}
            selectedCellId={selectedCellId}
          />
        </StandardCard>
      </div>
    </div>
  );
}