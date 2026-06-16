// app/components/calendar/calendar/sidebar/CalendarSidebar.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import GoogleCalendarConnectionModal from "./GoogleCalendarConnectionModal";
import ConnectedCalendarsList from "./ConnectedCalendarsList";

type Props = {
  companyId: string | null;
  locationId: string | null;
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
  companyId,
  locationId,
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
      if (!companyId) {
        return;
      }

      const res = await fetch(
        `/api/integrations/google/calendar/connected?companyId=${encodeURIComponent(
          companyId
        )}`,
        {
          method: "GET",
        }
      );

      const data = await res.json();

      if (data.ok && Array.isArray(data.calendars)) {
        setCalendars(data.calendars);

        const nextIds = data.calendars
          .map((calendar: ConnectedCalendarItem) => {
            return calendar.external_calendar_id;
          })
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
        <div className="border-b border-slate-200 px-3 py-2 xl2:px-4 xl2:py-3">
          <h2 className="text-xs font-semibold capitalize text-slate-900 xl2:text-sm">
            {monthLabel}
          </h2>
        </div>

        <div className="px-2.5 py-3 xl2:px-3 xl2:py-4">
          <div className="mb-1.5 grid grid-cols-7 gap-1 xl2:mb-2">
            {["L", "M", "X", "J", "V", "S", "D"].map((day) => (
              <div
                key={day}
                className="flex h-6 items-center justify-center text-[10px] font-semibold text-slate-400 xl2:h-8 xl2:text-[11px]"
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
                    "flex h-7 items-center justify-center rounded-lg text-xs font-medium transition-colors xl2:h-9 xl2:rounded-xl xl2:text-sm",
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

        <div className="mt-auto p-3 xl2:p-4">
          <button
            type="button"
            onClick={() => setGoogleModalOpen(true)}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 transition-colors hover:bg-slate-50 xl2:rounded-xl2 xl2:px-4 xl2:py-3"
          >
            <div className="flex items-center gap-2 xl2:gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg xl2:h-11 xl2:w-11 xl2:rounded-xl">
                <Image
                  src="/icon/google_calendar.webp"
                  alt=""
                  width={30}
                  height={30}
                  className="h-[22px] w-[22px] xl2:h-[30px] xl2:w-[30px]"
                />
              </div>

              <div className="flex min-w-0 flex-col items-start">
                <span className="text-xs font-semibold text-slate-900 xl2:text-sm">
                  Google Calendar
                </span>

                <span
                  className={[
                    "text-[11px] font-medium xl2:text-xs",
                    hasGoogleAccountConnected
                      ? "text-emerald-600"
                      : "text-slate-400",
                  ].join(" ")}
                >
                  {hasGoogleAccountConnected
                    ? "Cuenta conectada"
                    : "No conectado"}
                </span>

                {googleStatus.accountEmail ? (
                  <span className="max-w-[145px] truncate text-[10px] text-slate-400 xl2:max-w-[180px] xl2:text-[11px]">
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
        companyId={companyId}
        locationId={locationId}
        onClose={() => {
          setGoogleModalOpen(false);
          void fetchGoogleStatus();
          void fetchConnectedCalendars();
        }}
      />
    </>
  );
}