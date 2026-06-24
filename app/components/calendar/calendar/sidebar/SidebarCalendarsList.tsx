// app/components/calendar/calendar/sidebar/SidebarCalendarsList.tsx
"use client";

import { Check } from "lucide-react";

type ConnectedCalendar = {
  id: string;
  name: string;
  color?: string | null;
  purpose?: string | null;
  visible: boolean;
};

type Props = {
  calendars: ConnectedCalendar[];
  onToggleCalendar: (calendarId: string) => void;
};

export default function SidebarCalendarsList({
  calendars,
  onToggleCalendar,
}: Props) {


  const crussaderCalendars = calendars.filter((calendar) => {
  return calendar.purpose === "crussader_mirror";
});

const googleCalendars = calendars.filter((calendar) => {
  return calendar.purpose === "google_context";
});

return (
  <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2 xl2:px-3 xl2:py-3">
    {crussaderCalendars.length > 0 ? (
      <div className="mb-3 xl2:mb-4">
        <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400 xl2:mb-2 xl2:text-[11px]">
          Crussader
        </p>

        <div className="space-y-0.5">
          {crussaderCalendars.map((calendar) => (
            <CalendarRow
              key={calendar.id}
              calendar={calendar}
              onToggleCalendar={onToggleCalendar}
            />
          ))}
        </div>
      </div>
    ) : null}

    {googleCalendars.length > 0 ? (
      <div>
        <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400 xl2:mb-2 xl2:text-[11px]">
          Google Calendar
        </p>

        <div className="space-y-0.5">
          {googleCalendars.map((calendar) => (
            <CalendarRow
              key={calendar.id}
              calendar={calendar}
              onToggleCalendar={onToggleCalendar}
            />
          ))}
        </div>
      </div>
    ) : null}
  </div>
);
}

function CalendarRow({
  calendar,
  onToggleCalendar,
}: {
  calendar: ConnectedCalendar;
  onToggleCalendar: (calendarId: string) => void;
}) {
  const color = calendar.color || "#2563eb";

  return (
    <button
      type="button"
      onClick={() => {
  if (calendar.purpose === "google_context") {
    onToggleCalendar(calendar.id);
  }
}}
      className={[
  "flex w-full items-center gap-2 rounded-full px-2 py-1 text-left transition xl2:py-1.5",
  calendar.purpose === "google_context"
    ? "hover:bg-slate-100"
    : "",
].join(" ")}
    >
      <span
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border"
        style={{
          borderColor: color,
          backgroundColor:
  calendar.purpose === "crussader_mirror"
    ? color
    : calendar.visible
    ? color
    : "transparent",
        }}
      >
        {calendar.purpose === "crussader_mirror" || calendar.visible ? (
          <Check size={12} strokeWidth={3} className="text-white" />
        ) : null}
      </span>

      <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700 xl2:text-sm">
        {calendar.name}
      </span>
    </button>
  );
}