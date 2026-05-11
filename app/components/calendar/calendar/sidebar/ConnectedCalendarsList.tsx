// app/components/calendar/calendar/sidebar/ConnectedCalendarsList.tsx
"use client";

type ConnectedCalendar = {
  id: string;
  name: string;
  color?: string | null;
  visible: boolean;
};

type Props = {
  calendars: ConnectedCalendar[];
  onToggleCalendar: (calendarId: string) => void;
};

export default function ConnectedCalendarsList({
  calendars,
  onToggleCalendar,
}: Props) {
  if (calendars.length === 0) {
    return (
      <div className="px-4 py-3 text-xs text-slate-400">
        No hay calendarios conectados.
      </div>
    );
  }

  return (
    <div className="border-t border-slate-100 px-3 py-3">
      <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        Calendarios
      </p>

      <div className="space-y-1">
        {calendars.map((calendar) => (
          <button
            key={calendar.id}
            type="button"
            onClick={() => onToggleCalendar(calendar.id)}
            className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition hover:bg-slate-50"
          >
            <span
              className="h-3 w-3 rounded-full"
              style={{
                backgroundColor: calendar.color ?? "#2563eb",
              }}
            />

            <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">
              {calendar.name}
            </span>

            <span
              className={[
                "flex h-4 w-4 items-center justify-center rounded border",
                calendar.visible
                  ? "border-blue-600 bg-blue-600"
                  : "border-slate-300 bg-white",
              ].join(" ")}
            >
              {calendar.visible ? (
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              ) : null}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}