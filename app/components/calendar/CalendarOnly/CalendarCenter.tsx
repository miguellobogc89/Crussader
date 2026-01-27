//app/components/calendar/CalendarView.tsx
"use client";

import CalendarOnly, { type CalendarAppt } from "@/app/components/calendar/CalendarOnly";
import type { CellPainter } from "@/hooks/calendar/useCellPainter";

type View = "day" | "threeDays" | "workingWeek" | "week" | "month";

type Props = {
  selectedView: View;
  setSelectedView: (v: View) => void;
  selectedDate: Date;
  setSelectedDate: (d: Date) => void;

  calendarAppts: CalendarAppt[];
  onSelectAppointmentId: (id: string) => void;
  onEditAppointmentId: (id: string) => void;

  // ===== paint (centralizado) =====
  painter: CellPainter;
};

export default function CalendarCenter({
  selectedView,
  setSelectedView,
  selectedDate,
  setSelectedDate,
  calendarAppts,
  onSelectAppointmentId,
  onEditAppointmentId,
  painter,
}: Props) {
  return (
    <div className="flex-1 min-w-0 flex flex-col h-full">
      <div className="relative flex-1 min-h-0 bg-white border border-border rounded-xl overflow-hidden">
        <div className="absolute inset-0 overflow-auto">
          <div className="h-full min-h-0 flex flex-col p-3">
            <CalendarOnly
              selectedView={selectedView}
              onChangeView={(v: View) => setSelectedView(v)}
              selectedDate={selectedDate}
              onChangeDate={(d: Date) => setSelectedDate(d)}
              appointments={calendarAppts}
              onSelectAppointment={onSelectAppointmentId}
              onEditAppointmentId={onEditAppointmentId}
              painter={painter}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
