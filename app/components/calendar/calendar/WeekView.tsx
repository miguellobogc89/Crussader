// app/components/calendar/calendar/WeekView.tsx
"use client";

import AppointmentBlock from "@/app/components/calendar/appointments/AppointmentBlock";
import CalendarCell from "@/app/components/calendar/calendar/grid/CalendarCell";
import CurrentTimeLineFullSpan from "./CurrentTimeLineFullSpan";
import HourGuides from "./HourGuides";
import { layoutDayAppts, COL_GAP_PX } from "./layout";
import { localKeyTZ } from "./tz";
import type { CalendarAppt } from "./types";

type Props = {
  days: Date[];
  apptsByDay?: Map<string, CalendarAppt[]>;
  onSelect?: (id: string) => void;
  onEdit?: (id: string) => void;
  START_HOUR: number;
  HOURS_COUNT: number;
  ROW_PX: number;
  onCellClick?: (cellId: string) => void;
  onCellDoubleClick?: (cellId: string) => void;
  selectedCellId?: string | null;
};

export default function WeekView({
  days,
  apptsByDay = new Map<string, CalendarAppt[]>(),
  onSelect,
  onEdit,
  START_HOUR,
  HOURS_COUNT,
  ROW_PX,
  onCellClick,
  onCellDoubleClick,
  selectedCellId,
}: Props) {
  const hours = Array.from({ length: HOURS_COUNT }, (_, i) => START_HOUR + i);
  const canvasHeight = HOURS_COUNT * ROW_PX;

  function makeCellId(dayKey: string, hourIndex: number) {
    return `${dayKey}|${hourIndex}`;
  }

  return (
    <div className="relative h-full">
      <CurrentTimeLineFullSpan
        referenceDate={new Date()}
        START_HOUR={START_HOUR}
        HOURS_COUNT={HOURS_COUNT}
        ROW_PX={ROW_PX}
        HEADER_OFFSET_PX={0}
      />

      <HourGuides count={HOURS_COUNT} rowPx={ROW_PX} headerOffset={0} />

      <div
        className="grid h-full"
        style={{
          gridTemplateColumns: `64px repeat(${days.length}, minmax(0,1fr))`,
        }}
      >
        <div className="flex flex-col">
          {hours.map((hour) => (
            <div
              key={hour}
              className="flex items-start pt-0.5 text-xs text-muted-foreground"
              style={{ height: ROW_PX }}
            >
              {String(hour).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {days.map((day) => {
          const dayKey = localKeyTZ(day);
          const appointments = apptsByDay.get(dayKey) ?? [];
          const layout = layoutDayAppts(appointments, START_HOUR, ROW_PX);

          return (
            <div key={dayKey} className="relative min-w-0" style={{ height: canvasHeight }}>
              {Array.from({ length: HOURS_COUNT }, (_, hourIndex) => {
                const cellId = makeCellId(dayKey, hourIndex);

                return (
<CalendarCell
  key={cellId}
  cellId={cellId}
  rowPx={ROW_PX}
  isSelected={selectedCellId === cellId}
  onClick={onCellClick}
  onDoubleClick={onCellDoubleClick}
/>
                );
              })}

              {appointments.map((appointment) => {
                const itemLayout = layout.get(appointment.id);

                if (!itemLayout) {
                  return null;
                }

                const widthStyle = `calc(${itemLayout.widthPct}% - ${COL_GAP_PX}px)`;
                const leftStyle = `calc(${itemLayout.leftPct}% + ${COL_GAP_PX / 2}px)`;

                return (
                  <div
                    key={appointment.id}
                    className="absolute z-20"
                    style={{
                      top: itemLayout.top,
                      height: itemLayout.height,
                      left: leftStyle,
                      width: widthStyle,
                    }}
                  >
                    <AppointmentBlock
                      id={appointment.id}
                      startAtISO={appointment.startAt}
                      serviceName={appointment.serviceName}
                      employeeName={appointment.employeeName}
                      resourceName={appointment.resourceName}
                      serviceColor={appointment.serviceColor}
                      onSelect={onSelect}
                      onEdit={onEdit}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}