"use client";

import CalendarOnly, { type CalendarAppt } from "@/app/components/calendar/CalendarOnly";

type View = "day" | "threeDays" | "workingWeek" | "week" | "month";

type Props = {
  selectedView: View;
  setSelectedView: (v: View) => void;
  selectedDate: Date;
  setSelectedDate: (d: Date) => void;
  calendarAppts: CalendarAppt[];
  onSelectAppointmentId: (id: string) => void;
  onEditAppointmentId: (id: string) => void;
};

export default function CalendarCenter({
  selectedView,
  setSelectedView,
  selectedDate,
  setSelectedDate,
  calendarAppts,
  onSelectAppointmentId,
  onEditAppointmentId,
}: Props) {
  return (
    // ocupa todo el alto disponible de su padre
    <div className="flex-1 min-w-0 flex flex-col h-full">
      {/* Marco exterior único */}
      <div className="relative flex-1 min-h-0 bg-white border border-border rounded-xl overflow-hidden">
        {/* Capa de relleno a 100% alto; si sobra, scroll interno */}
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
            />
          </div>
        </div>
      </div>
    </div>
  );
}
