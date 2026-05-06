// app/dashboard/googleCalendar/page.tsx
"use client";

import { useState } from "react";
import { CalendarDays, Check, Loader2 } from "lucide-react";

type CalendarItem = {
  id: string;
  summary: string;
  description?: string | null;
  primary: boolean;
  accessRole?: string;
  backgroundColor?: string | null;
};

export default function GoogleCalendarPage() {
  const [calendars, setCalendars] = useState<CalendarItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCalendars = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/integrations/google/calendar/calendars", {
        method: "GET",
      });

      const data = await res.json();

      if (data.calendars) {
        const selectable = data.calendars.filter((cal: CalendarItem) =>
          ["owner", "writer"].includes(cal.accessRole || "")
        );

        setCalendars(selectable);
      }
    } catch (err) {
      console.error("[GoogleCalendarPage] fetchCalendars error:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCalendar = (calendarId: string) => {
    setSelectedIds((current) => {
      if (current.includes(calendarId)) {
        return current.filter((id) => id !== calendarId);
      }

      return [...current, calendarId];
    });
  };

  const importSelectedCalendars = async () => {
  if (selectedIds.length === 0) return;

  const res = await fetch("/api/integrations/google/calendar/import", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      companyId: "cmfv7vjd30000i5xktjoncp48",
      locationId: "cmkdnn4ve001ymtcs4hk8vtno",
      selectedCalendarIds: selectedIds,
    }),
  });

  const data = await res.json();
  console.log("[GOOGLE CALENDAR IMPORT]", data);
};

  return (
    <div className="min-h-full bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">
            Google Calendar
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Conecta Google y selecciona los calendarios que quieres importar a
            Crussader.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <CalendarDays size={20} />
              </div>

              <div>
                <h2 className="font-medium text-slate-950">
                  Calendarios disponibles
                </h2>
                <p className="text-sm text-slate-500">
                  Solo se muestran calendarios editables.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                window.location.href =
                  "/api/integrations/google/calendar/connect?companyId=cmfv7vjd30000i5xktjoncp48";
              }}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Conectar Google
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {calendars.map((cal) => {
              const selected = selectedIds.includes(cal.id);

              return (
                <button
                  key={cal.id}
                  type="button"
                  onClick={() => toggleCalendar(cal.id)}
                  className="flex w-full items-center gap-4 px-6 py-4 text-left hover:bg-slate-50"
                >
                  <div
                    className="size-4 rounded-sm"
                    style={{
                      backgroundColor: cal.backgroundColor || "#2563eb",
                    }}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-slate-950">
                        {cal.summary}
                      </p>

                      {cal.primary && (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          Principal
                        </span>
                      )}
                    </div>

                    <p className="truncate text-sm text-slate-500">{cal.id}</p>
                  </div>

                  <div
                    className={[
                      "flex size-6 items-center justify-center rounded-full border",
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

            {!loading && calendars.length === 0 && (
              <div className="px-6 py-10 text-center text-sm text-slate-500">
                Todavía no se han cargado calendarios.
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
            <p className="text-sm text-slate-500">
              {selectedIds.length} calendario(s) seleccionado(s)
            </p>

<button
  onClick={fetchCalendars}
  disabled={loading}
  className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
>
  {loading && <Loader2 size={16} className="animate-spin" />}
  Cargar calendarios
</button>

<button
  onClick={importSelectedCalendars}
  disabled={selectedIds.length === 0}
  className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
>
  Importar seleccionados
</button>
          </div>
        </div>
      </div>
    </div>
  );
}