"use client";

import CalendarOnly, { type CalendarAppt } from "@/app/components/calendar/CalendarOnly";

type Props = {
  selectedView: "month" | "week" | "day";
  setSelectedView: (v: "month" | "week" | "day") => void;
  selectedDate: Date;
  setSelectedDate: (d: Date) => void;
  // ya no usamos la lista inferior, pero mantenemos los tipos por compat
  appointments: any[];
  calendarAppts: CalendarAppt[];
  fmtDayTitle: Intl.DateTimeFormat;
  onSelectAppointment: (a: { id: string }) => void;
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
    <div className="flex-1 min-w-0 flex flex-col">
      {/* Marco exterior único */}
      <div className="flex-1 min-h-0 bg-white border border-border rounded-xl overflow-hidden">
        {/* Solo calendario, sin lista inferior */}
        <CalendarOnly
          selectedView={selectedView}
          onChangeView={setSelectedView}
          selectedDate={selectedDate}
          onChangeDate={(d) => d && setSelectedDate(d)}
          appointments={calendarAppts}
          onSelectAppointment={onSelectAppointmentId}
          onEditAppointmentId={onEditAppointmentId}
        />
      </div>
    </div>
  );
}
