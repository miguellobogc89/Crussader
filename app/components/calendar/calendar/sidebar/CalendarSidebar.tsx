// app/components/calendar/calendar/sidebar/CalendarSidebar.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import GoogleCalendarConnectionModal from "./GoogleCalendarConnectionModal";
import ConnectedCalendarsList from "./ConnectedCalendarsList";

type Props = {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;

  visibleGoogleCalendarIds: string[];

  onChangeVisibleGoogleCalendarIds: React.Dispatch<
    React.SetStateAction<string[]>
  >;
};

type ConnectedCalendarItem = {
  id: string;
  external_calendar_id: string | null;
  external_calendar_name: string | null;
  external_account_email: string | null;
  last_synced_at: string | null;
};

type GoogleConnectionStatus = {
  connected: boolean;
  accountEmail?: string | null;
};

type VisibleCalendarItem = {
  id: string;
  name: string;
  color?: string | null;
  visible: boolean;
};

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfCalendarGrid(date: Date) {
  const first = startOfMonth(date);
  const day = first.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  const start = new Date(first);
  start.setDate(first.getDate() + diff);

  return start;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function CalendarSidebar({
  selectedDate,
  onSelectDate,
  visibleGoogleCalendarIds,
  onChangeVisibleGoogleCalendarIds,
}: Props) {
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [calendars, setCalendars] = useState<ConnectedCalendarItem[]>([]);
  const [googleStatus, setGoogleStatus] = useState<GoogleConnectionStatus>({
    connected: false,
    accountEmail: null,
  });

  async function fetchConnectedCalendars() {
    try {
      const res = await fetch(
        "/api/integrations/google/calendar/connected?companyId=cmfv7vjd30000i5xktjoncp48",
        {
          method: "GET",
        },
      );

      const data = await res.json();

    if (data.ok && Array.isArray(data.calendars)) {
  setCalendars(data.calendars);

  const nextIds = data.calendars
    .map(
      (calendar: ConnectedCalendarItem) =>
        calendar.external_calendar_id,
    )
    .filter((id: string | null): id is string => Boolean(id));

  onChangeVisibleGoogleCalendarIds((current) => {
    if (current.length === 0) {
      return nextIds;
    }

    return current.filter((id) => nextIds.includes(id));
  });
}
    } catch (error) {
      console.error("[CalendarSidebar] fetch connected calendars error", error);
    }
  }

  async function fetchGoogleStatus() {
    try {
      const res = await fetch("/api/integrations/google/calendar/status", {
        method: "GET",
      });

      const data = await res.json();

      setGoogleStatus({
        connected: Boolean(data.connected),
        accountEmail: data.connection?.accountEmail || null,
      });
    } catch (error) {
      console.error("[CalendarSidebar] fetch google status error", error);

      setGoogleStatus({
        connected: false,
        accountEmail: null,
      });
    }
  }

  useEffect(() => {
    void fetchGoogleStatus();
    void fetchConnectedCalendars();
  }, []);

  const today = new Date();

  const monthLabel = selectedDate.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

  const gridStart = startOfCalendarGrid(selectedDate);

  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });

  const visibleCalendars: VisibleCalendarItem[] = calendars
    .filter((calendar) => Boolean(calendar.external_calendar_id))
    .map((calendar) => {
      const calendarId = calendar.external_calendar_id as string;

      return {
        id: calendarId,
        name:
          calendar.external_calendar_name ||
          calendar.external_account_email ||
          "Calendario sin nombre",
        color: null,
        visible: visibleGoogleCalendarIds.includes(calendarId),
      };
    });

function toggleVisibleCalendar(calendarId: string) {
  onChangeVisibleGoogleCalendarIds((current) => {
    if (current.includes(calendarId)) {
      return current.filter((id) => id !== calendarId);
    }

    return [...current, calendarId];
  });
}

  const hasGoogleAccountConnected = googleStatus.connected;

  return (
    <>
      <div className="flex h-full flex-col overflow-hidden bg-white">
        <div className="border-b border-slate-200 px-4 py-4">
          <h2 className="text-sm font-semibold capitalize text-slate-900">
            {monthLabel}
          </h2>
        </div>

        <div className="px-3 py-4">
          <div className="mb-2 grid grid-cols-7 gap-1">
            {["L", "M", "X", "J", "V", "S", "D"].map((day) => (
              <div
                key={day}
                className="flex h-8 items-center justify-center text-[11px] font-semibold text-slate-400"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const isTodayDay = isSameDay(day, today);
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = day.getMonth() === selectedDate.getMonth();

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => onSelectDate(day)}
                  className={[
                    "flex h-9 items-center justify-center rounded-xl text-sm font-medium transition-colors",
                    isSelected ? "bg-blue-600 text-white shadow-sm" : "",
                    !isSelected && isTodayDay ? "bg-blue-50 text-blue-700" : "",
                    !isSelected && !isTodayDay
                      ? "text-slate-700 hover:bg-slate-100"
                      : "",
                    !isCurrentMonth ? "opacity-35" : "",
                  ].join(" ")}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        <ConnectedCalendarsList
          calendars={visibleCalendars}
          onToggleCalendar={toggleVisibleCalendar}
        />

        <div className="mt-auto p-4">
          <button
            type="button"
            onClick={() => setGoogleModalOpen(true)}
            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 transition-colors hover:bg-slate-50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl">
                <Image
                  src="/icon/google_calendar.webp"
                  alt=""
                  width={30}
                  height={30}
                  className="h-[30px] w-[30px]"
                />
              </div>

              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold text-slate-900">
                  Google Calendar
                </span>

                <span
                  className={[
                    "text-xs font-medium",
                    hasGoogleAccountConnected
                      ? "text-emerald-600"
                      : "text-slate-400",
                  ].join(" ")}
                >
                  {hasGoogleAccountConnected ? "Cuenta conectada" : "No conectado"}
                </span>

                {googleStatus.accountEmail ? (
                  <span className="max-w-[180px] truncate text-[11px] text-slate-400">
                    {googleStatus.accountEmail}
                  </span>
                ) : null}
              </div>
            </div>
          </button>
        </div>
      </div>

      <GoogleCalendarConnectionModal
        open={googleModalOpen}
        onClose={() => {
          setGoogleModalOpen(false);
          void fetchGoogleStatus();
          void fetchConnectedCalendars();
        }}
      />
    </>
  );
}