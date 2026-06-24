// app/components/calendar/calendar/sidebar/CalendarSidebar.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import GoogleCalendarConnectionModal from "./GoogleCalendarConnectionModal";
import ConnectedCalendarsList from "./SidebarCalendarsList";
import MiniCalendar from "./MiniCalendar";
import { CheckCircle2 } from "lucide-react";

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
  purpose?: string | null;
  background_color?: string | null;
  foreground_color?: string | null;
  color_id?: string | null;
};

type GoogleConnectionStatus = {
  connected: boolean;
  accountEmail?: string | null;
};

type VisibleCalendarItem = {
  id: string;
  name: string;
  color?: string | null;
  purpose?: string | null;
  visible: boolean;
};

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

      const nextStatus = {
        connected: Boolean(data.connected),
        accountEmail: data.connection?.accountEmail || null,
      };

      setGoogleStatus(nextStatus);

      return nextStatus;
    } catch (error) {
      console.error("[CalendarSidebar] fetch google status error", error);

      const fallbackStatus = {
        connected: false,
        accountEmail: null,
      };

      setGoogleStatus(fallbackStatus);

      return fallbackStatus;
    }
  }

  async function syncGoogleCalendars() {
    try {
      if (!companyId || !locationId) {
        return;
      }

      await fetch("/api/integrations/google/calendar/sync-calendars", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId,
          locationId,
        }),
      });
    } catch (error) {
      console.error("[CalendarSidebar] sync calendars error", error);
    }
  }

async function loadCalendars() {
  const status = await fetchGoogleStatus();

  if (!status.connected) {
    setCalendars([]);
    onChangeVisibleGoogleCalendarIds([]);
    return;
  }

  await syncGoogleCalendars();
  await fetchConnectedCalendars();
}

  useEffect(() => {
    void loadCalendars();
  }, [companyId, locationId]);

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
  color: calendar.background_color || null,
  purpose: calendar.purpose || null,
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
        <MiniCalendar
          selectedDate={selectedDate}
          onSelectDate={onSelectDate}
        />

        <ConnectedCalendarsList
          calendars={visibleCalendars}
          onToggleCalendar={toggleVisibleCalendar}
        />

        <div className="mt-auto p-3 xl2:p-4">
          <button
            type="button"
            onClick={() => {
              if (!hasGoogleAccountConnected) {
                if (!companyId || !locationId) {
                  return;
                }

                window.location.href =
                  `/api/integrations/google/calendar/connect?companyId=${companyId}&locationId=${locationId}`;

                return;
              }

              setGoogleModalOpen(true);
            }}
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
                <span className="flex max-w-full items-center gap-1.5 text-xs font-semibold text-slate-900 xl2:text-sm">
                  Google Calendar

                  {hasGoogleAccountConnected ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  ) : null}
                </span>

                <span className="block max-w-[135px] truncate text-[11px] font-medium text-slate-400 xl2:max-w-[180px] xl2:text-xs">
                  {hasGoogleAccountConnected
                    ? googleStatus.accountEmail || "Cuenta conectada"
                    : "No conectado"}
                </span>
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
          void loadCalendars();
        }}
      />
    </>
  );
}