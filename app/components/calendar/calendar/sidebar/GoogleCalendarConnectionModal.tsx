// app/components/calendar/calendar/sidebar/GoogleCalendarConnectionModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  Loader2,
  LogOut,
} from "lucide-react";

import StandardModal from "@/app/components/crussader/StandardModal";

const COMPANY_ID = "cmfv7vjd30000i5xktjoncp48";
const LOCATION_ID = "cmkdnn4ve001ymtcs4hk8vtno";

type CalendarItem = {
  id: string;
  summary: string;
  primary: boolean;
  accessRole?: string;
  backgroundColor?: string | null;
};

type ConnectedCalendar = {
  id: string;
  external_calendar_id: string | null;
  external_calendar_name: string | null;
  external_account_email: string | null;
};

type GoogleStatus = {
  connected: boolean;
  accountEmail: string | null;
};

type CalendarRow = CalendarItem & {
  connected: boolean;
  connectedConnectionId: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function GoogleCalendarConnectionModal({
  open,
  onClose,
}: Props) {
  const [status, setStatus] = useState<GoogleStatus>({
    connected: false,
    accountEmail: null,
  });

  const [calendars, setCalendars] = useState<CalendarItem[]>([]);
  const [connectedCalendars, setConnectedCalendars] = useState<
    ConnectedCalendar[]
  >([]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [disconnectingGoogle, setDisconnectingGoogle] = useState(false);

const calendarRows = useMemo<CalendarRow[]>(() => {
  const rowsFromGoogle = calendars.map((calendar) => {
    const connectedCalendar = connectedCalendars.find((item) => {
      return item.external_calendar_id === calendar.id;
    });

    return {
      ...calendar,
      connected: Boolean(connectedCalendar),
      connectedConnectionId: connectedCalendar?.id || null,
    };
  });

  const missingConnectedRows = connectedCalendars
    .filter((connectedCalendar) => {
      return !calendars.some((calendar) => {
        return calendar.id === connectedCalendar.external_calendar_id;
      });
    })
    .map((connectedCalendar) => {
      return {
        id: connectedCalendar.external_calendar_id || connectedCalendar.id,
        summary:
          connectedCalendar.external_calendar_name || "Calendario conectado",
        primary: false,
        accessRole: "writer",
        backgroundColor: "#1a73e8",
        connected: true,
        connectedConnectionId: connectedCalendar.id,
      };
    });

  return [...rowsFromGoogle, ...missingConnectedRows];
}, [calendars, connectedCalendars]);

  const selectedRows = useMemo(() => {
    return calendarRows.filter((row) => {
      return selectedIds.includes(row.id);
    });
  }, [calendarRows, selectedIds]);

  const importCount = selectedRows.filter((row) => {
    return !row.connected;
  }).length;

  const disconnectCount = selectedRows.filter((row) => {
    return row.connected;
  }).length;

  useEffect(() => {
    if (!open) {
      return;
    }

    void hydrateModal();
  }, [open]);

  async function hydrateModal() {
    try {
      setLoading(true);
      setSelectedIds([]);

      const connected = await fetchGoogleStatus();

      if (!connected) {
        setCalendars([]);
        setConnectedCalendars([]);
        return;
      }

      await Promise.all([
        fetchCalendars(),
        fetchConnectedCalendars(),
      ]);
    } catch (err) {
      console.error("[GoogleCalendarModal] hydrateModal error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchGoogleStatus() {
    const res = await fetch(
      "/api/integrations/google/calendar/status",
    );

    const data = await res.json();

    const connected = Boolean(data.connected);

    setStatus({
      connected,
      accountEmail: data.connection?.accountEmail || null,
    });

    return connected;
  }

  async function fetchCalendars() {
    const res = await fetch(
      "/api/integrations/google/calendar/calendars",
    );

    const data = await res.json();

    if (!data.ok || !Array.isArray(data.calendars)) {
      setCalendars([]);
      return;
    }

    const selectable = data.calendars.filter((cal: CalendarItem) => {
      return ["owner", "writer"].includes(cal.accessRole || "");
    });

    setCalendars(selectable);
  }

  async function fetchConnectedCalendars() {
    const res = await fetch(
      `/api/integrations/google/calendar/connected?companyId=${COMPANY_ID}`,
    );

    const data = await res.json();

    if (data.ok && Array.isArray(data.calendars)) {
      setConnectedCalendars(data.calendars);
      return;
    }

    setConnectedCalendars([]);
  }

  function toggleCalendar(calendarId: string) {
    setSelectedIds((current) => {
      if (current.includes(calendarId)) {
        return current.filter((id) => id !== calendarId);
      }

      return [...current, calendarId];
    });
  }

  async function disconnectCalendar(connectionId: string) {
    const res = await fetch(
      `/api/integrations/google/calendar/connected/${connectionId}`,
      {
        method: "DELETE",
      },
    );

    const data = await res.json();

    return Boolean(data.ok);
  }

  async function importCalendars(calendarIds: string[]) {
    const res = await fetch(
      "/api/integrations/google/calendar/import",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId: COMPANY_ID,
          locationId: LOCATION_ID,
          selectedCalendarIds: calendarIds,
        }),
      },
    );

    const data = await res.json();

    return Boolean(data.ok);
  }

  async function applyChanges() {
    if (selectedRows.length === 0) {
      return;
    }

    try {
      setSaving(true);

      const toImport = selectedRows
        .filter((row) => !row.connected)
        .map((row) => row.id);

      const toDisconnect = selectedRows.filter((row) => {
        return row.connected && row.connectedConnectionId;
      });

      if (toImport.length > 0) {
        await importCalendars(toImport);
      }

      if (toDisconnect.length > 0) {
        await Promise.all(
          toDisconnect.map((row) => {
            return disconnectCalendar(
              row.connectedConnectionId as string,
            );
          }),
        );
      }

      setSelectedIds([]);

      await Promise.all([
        fetchCalendars(),
        fetchConnectedCalendars(),
      ]);

      onClose();
    } catch (err) {
      console.error("[GoogleCalendarModal] applyChanges error:", err);
    } finally {
      setSaving(false);
    }
  }

  async function disconnectGoogle() {
    try {
      setDisconnectingGoogle(true);

      const res = await fetch(
        "/api/integrations/google/calendar/disconnect",
        {
          method: "DELETE",
        },
      );

      const data = await res.json();

      if (data.ok) {
        
        setStatus({
          connected: false,
          accountEmail: null,
        });

        setCalendars([]);
        setConnectedCalendars([]);
        setSelectedIds([]);

        onClose();
      }
    } catch (err) {
      console.error("[GoogleCalendarModal] disconnectGoogle error:", err);
    } finally {
      setDisconnectingGoogle(false);
    }
  }

  return (
    <StandardModal
      open={open}
      title="Google Calendar"
      contentClassName="sm:max-w-[760px]"
      onClose={onClose}
      footer={
        status.connected ? (
          <div className="flex w-full items-center justify-between">
            <p className="text-sm text-slate-500">
              {selectedIds.length} seleccionado(s)
            </p>

            <button
              type="button"
              onClick={applyChanges}
              disabled={selectedIds.length === 0 || saving}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-blue-600 px-6 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
            >
              {saving ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : null}

              {importCount > 0 && disconnectCount > 0
                ? "Aplicar cambios"
                : disconnectCount > 0
                  ? "Desconectar"
                  : "Importar"}
            </button>
          </div>
        ) : null
      }
    >
      <div className="px-1">
        <div className="flex items-center justify-between px-4 pb-4">
          <div className="flex items-center gap-4">
            <div className="flex size-11 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <CalendarDays size={22} />
            </div>

            <div>
              <h3 className="text-base font-semibold text-slate-950">
                Calendarios disponibles
              </h3>

              <p className="text-sm text-slate-500">
                {status.connected
                  ? status.accountEmail
                  : "Conecta Google Calendar"}
              </p>
            </div>
          </div>

          {status.connected ? (
            <button
              type="button"
              onClick={disconnectGoogle}
              disabled={disconnectingGoogle}
              className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              {disconnectingGoogle ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <LogOut size={16} />
              )}

              Desconectar Google
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                window.location.href = `/api/integrations/google/calendar/connect?companyId=${COMPANY_ID}`;
              }}
              className="h-10 rounded-full border border-slate-300 px-5 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              Conectar Google
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-sm text-slate-500">
            <Loader2
              size={18}
              className="mr-2 animate-spin"
            />
            Cargando calendarios...
          </div>
        ) : null}

        {!loading && status.connected ? (
          <div>
            {calendarRows.map((calendar) => {
              const selected = selectedIds.includes(calendar.id);

              return (
                <button
                  key={calendar.id}
                  type="button"
                  onClick={() => toggleCalendar(calendar.id)}
                  className="flex w-full items-center gap-4 px-4 py-4 text-left hover:bg-slate-50"
                >
                  <div
                    className="size-4 shrink-0 rounded"
                    style={{
                      backgroundColor:
                        calendar.backgroundColor || "#1a73e8",
                    }}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[15px] font-medium text-slate-950">
                        {calendar.summary}
                      </p>

                      {calendar.primary ? (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          Principal
                        </span>
                      ) : null}

                      {calendar.connected ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          Conectado
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                          No conectado
                        </span>
                      )}
                    </div>

                    <p className="truncate text-sm text-slate-500">
                      {calendar.id}
                    </p>
                  </div>

                  <div
                    className={[
                      "flex size-6 items-center justify-center rounded-full border transition-all",
                      selected
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-300 bg-white text-transparent",
                    ].join(" ")}
                  >
                    <Check size={14} />
                  </div>
                </button>
              );
            })}

            {calendarRows.length === 0 ? (
              <div className="py-16 text-center text-sm text-slate-500">
                No hay calendarios disponibles.
              </div>
            ) : null}
          </div>
        ) : null}

        {!loading && !status.connected ? (
          <div className="py-16 text-center text-sm text-slate-500">
            Conecta Google para cargar tus calendarios.
          </div>
        ) : null}
      </div>
    </StandardModal>
  );
}