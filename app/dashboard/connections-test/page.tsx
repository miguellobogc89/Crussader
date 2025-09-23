"use client";

import { useEffect, useMemo, useState } from "react";

type GCalEvent = {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
  htmlLink?: string;
};

/** === Helper para forzar abrir con la cuenta/agenda correctas === */
function buildCalendarOpenLink(htmlLink?: string, workEmail?: string, calendarId?: string) {
  if (!htmlLink) return "#";
  let url = htmlLink;
  const add = (k: string, v: string) => {
    const sep = url.includes("?") ? "&" : "?";
    url += `${sep}${k}=${encodeURIComponent(v)}`;
  };
  if (workEmail && !url.includes("authuser=")) add("authuser", workEmail);
  if (calendarId && !url.includes("src=")) add("src", calendarId);
  return url;
}

export default function ConnectionsTestPage() {
  // --- Listado ---
  const [events, setEvents] = useState<GCalEvent[]>([]);
  const [listMsg, setListMsg] = useState<string>("");

  // --- Crear (modal) ---
  const [isOpen, setIsOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<string>("");

  // Mostrar enlace directo tras crear
  const [createdHtmlLink, setCreatedHtmlLink] = useState<string | null>(null);

  // Campos del modal
  const [summary, setSummary] = useState("Evento de prueba");
  const [allDay, setAllDay] = useState(false);
  const [startLocal, setStartLocal] = useState("");
  const [endLocal, setEndLocal] = useState("");
  const [startDate, setStartDate] = useState(""); // YYYY-MM-DD
  const [endDate, setEndDate] = useState("");     // YYYY-MM-DD
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [attendees, setAttendees] = useState(""); // csv emails
  const [calendarId, setCalendarId] = useState(""); // opcional
  const [connectionId, setConnectionId] = useState(""); // opcional

  // ⚠️ NUEVO: email de la cuenta de empresa conectada (para forzar authuser)
  const [workEmail, setWorkEmail] = useState("");

  // Prefills al abrir
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const plus30 = new Date(now.getTime() + 30 * 60 * 1000);

      // datetime-local necesita formato “YYYY-MM-DDTHH:mm”
      const toLocalInput = (d: Date) =>
        new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);

      setStartLocal(toLocalInput(now));
      setEndLocal(toLocalInput(plus30));

      const yyyyMmDd = (d: Date) => d.toISOString().slice(0, 10);
      setStartDate(yyyyMmDd(now));
      setEndDate(yyyyMmDd(plus30));

      setSummary("Evento de prueba");
      setDescription("");
      setLocation("");
      setAttendees("");
      setCreateMsg("");
      setCreatedHtmlLink(null);
    }
  }, [isOpen]);

  // Formateo de fechas en la lista
  const fmt = useMemo(
    () =>
      new Intl.DateTimeFormat("es-ES", {
        timeZone: "Europe/Madrid",
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
    []
  );

  const renderWhen = (ev: GCalEvent) => {
    const s = ev.start;
    const e = ev.end;
    if (s?.date && e?.date) {
      try {
        const d1 = new Date(s.date + "T00:00:00Z");
        const d2 = new Date(new Date(e.date + "T00:00:00Z").getTime() - 1);
        return `${fmt.format(d1)} — ${fmt.format(d2)} (todo el día)`;
      } catch {
        return "Fecha (todo el día)";
      }
    }
    if (s?.dateTime && e?.dateTime) {
      try {
        return `${fmt.format(new Date(s.dateTime))} — ${fmt.format(new Date(e.dateTime))}`;
      } catch {
        return "Fecha/hora";
      }
    }
    return "Sin fecha";
  };

  async function fetchEvents() {
    setListMsg("⏳ Cargando eventos...");
    try {
      const res = await fetch("/api/google/calendar/list", { credentials: "include", cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setListMsg(`❌ ${data.error || "Error"}`);
        setEvents([]);
        return;
      }
      setEvents(Array.isArray(data.items) ? data.items : []);
      setListMsg(`✅ ${data.items?.length || 0} eventos encontrados`);
    } catch (err: any) {
      setListMsg(`❌ Error: ${err.message}`);
      setEvents([]);
    }
  }

  // Helpers input
  const isAllDayDate = (val: string) => /^\d{4}-\d{2}-\d{2}$/.test(val);
  const toISO = (val: string) => {
    try {
      return new Date(val).toISOString();
    } catch {
      return null;
    }
  };

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateMsg("");
    setCreatedHtmlLink(null);

    try {
      let payload: any = { summary };

      if (allDay) {
        if (!isAllDayDate(startDate) || !isAllDayDate(endDate)) {
          setCreateMsg("❌ Para ‘todo el día’ usa formato YYYY-MM-DD en inicio y fin.");
          setCreating(false);
          return;
        }
        payload.start = { date: startDate, timeZone: "Europe/Madrid" };
        payload.end = { date: endDate, timeZone: "Europe/Madrid" };
      } else {
        if (!startLocal || !endLocal) {
          setCreateMsg("❌ Rellena inicio y fin.");
          setCreating(false);
          return;
        }
        const sISO = toISO(startLocal);
        const eISO = toISO(endLocal);
        if (!sISO || !eISO) {
          setCreateMsg("❌ Formato de fecha/hora inválido.");
          setCreating(false);
          return;
        }
        payload.start = { dateTime: sISO, timeZone: "Europe/Madrid" };
        payload.end = { dateTime: eISO, timeZone: "Europe/Madrid" };
      }

      if (description.trim()) payload.description = description.trim();
      if (location.trim()) payload.location = location.trim();
      if (calendarId.trim()) payload.calendarId = calendarId.trim();
      if (connectionId.trim()) payload.connectionId = connectionId.trim();
      if (attendees.trim()) {
        payload.attendees = attendees
          .split(",")
          .map((s) => s.trim())
          .filter((x) => x.includes("@"));
      }

      const res = await fetch("/api/google/calendar/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const ct = res.headers.get("content-type") || "";
      const raw = await res.text();
      let data: any = null;

      if (ct.includes("application/json")) {
        try {
          data = JSON.parse(raw);
        } catch {
          setCreateMsg(`❌ JSON inválido (${res.status}). Texto: ${raw.slice(0, 200)}…`);
          setCreating(false);
          return;
        }
      } else {
        setCreateMsg(`❌ Respuesta no JSON (${res.status}). Texto: ${raw.slice(0, 200)}…`);
        setCreating(false);
        return;
      }

      if (!res.ok || !data?.ok) {
        setCreateMsg(`❌ ${data?.error || "Error al crear el evento"}`);
        setCreating(false);
        return;
      }

      setCreateMsg("✅ Evento creado.");
      setCreatedHtmlLink(data.htmlLink || null);

      // Cierra el modal tras 800ms y refresca la lista
      setTimeout(async () => {
        setIsOpen(false);
        await fetchEvents();
      }, 800);
    } catch (err: any) {
      setCreateMsg(`❌ Error: ${err.message}`);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">🔌 Connections Test</h1>

      {/* ----- Listar ----- */}
      <div className="space-y-4 border rounded-md p-4">
        <h2 className="text-xl font-semibold">Google Calendar — Eventos</h2>

        {/* NUEVO: email de la cuenta conectada para forzar authuser */}
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <label className="text-sm min-w-48">Email cuenta empresa (authuser):</label>
          <input
            className="border rounded px-3 py-2 w-full"
            value={workEmail}
            onChange={(e) => setWorkEmail(e.target.value)}
            placeholder="empresa@tu-dominio.com"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <a
            href="/api/integrations/google/calendar/connect"
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Conectar Google Calendar
          </a>
          <button
            onClick={fetchEvents}
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
          >
            Ver eventos
          </button>
          <button
            onClick={() => setIsOpen(true)}
            className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700"
          >
            Crear evento
          </button>
        </div>

        {listMsg && <p className="text-sm mt-2">{listMsg}</p>}

        {events.length > 0 ? (
          <ul className="divide-y border rounded-md mt-3">
            {events.map((ev) => (
              <li key={ev.id} className="p-3">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <div className="font-medium">{ev.summary || "(Sin título)"}</div>
                    <div className="text-sm text-gray-600">{renderWhen(ev)}</div>
                  </div>
                  {ev.htmlLink && (
                    <a
                      className="text-sm underline text-blue-700"
                      href={buildCalendarOpenLink(ev.htmlLink, workEmail || undefined, calendarId || undefined)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Abrir en Google Calendar
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-600">No hay eventos próximos.</p>
        )}
      </div>

      {/* ----- Modal ----- */}
      {isOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !creating && setIsOpen(false)}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-xl rounded-lg bg-white shadow p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Crear evento</h3>
                <button
                  onClick={() => !creating && setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={submitCreate} className="space-y-3">
                <div>
                  <label className="block text-sm mb-1">Título *</label>
                  <input
                    className="border rounded px-3 py-2 w-full"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    required
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="allday"
                    type="checkbox"
                    checked={allDay}
                    onChange={(e) => setAllDay(e.target.checked)}
                  />
                  <label htmlFor="allday" className="text-sm">Evento de todo el día</label>
                </div>

                {!allDay ? (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm mb-1">Inicio *</label>
                      <input
                        type="datetime-local"
                        className="border rounded px-3 py-2 w-full"
                        value={startLocal}
                        onChange={(e) => setStartLocal(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Fin *</label>
                      <input
                        type="datetime-local"
                        className="border rounded px-3 py-2 w-full"
                        value={endLocal}
                        onChange={(e) => setEndLocal(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm mb-1">Inicio (YYYY-MM-DD) *</label>
                      <input
                        className="border rounded px-3 py-2 w-full"
                        placeholder="2025-09-23"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Fin (YYYY-MM-DD) *</label>
                      <input
                        className="border rounded px-3 py-2 w-full"
                        placeholder="2025-09-24"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm mb-1">Descripción</label>
                    <textarea
                      className="border rounded px-3 py-2 w-full"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Notas del evento"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Ubicación</label>
                    <input
                      className="border rounded px-3 py-2 w-full"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Oficina, Google Meet, etc."
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm mb-1">Invitados (emails, coma)</label>
                    <input
                      className="border rounded px-3 py-2 w-full"
                      value={attendees}
                      onChange={(e) => setAttendees(e.target.value)}
                      placeholder="a@ejemplo.com, b@ejemplo.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Calendar ID (opcional)</label>
                    <input
                      className="border rounded px-3 py-2 w-full"
                      value={calendarId}
                      onChange={(e) => setCalendarId(e.target.value)}
                      placeholder="primary (por defecto)"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-1">connectionId (opcional)</label>
                  <input
                    className="border rounded px-3 py-2 w-full"
                    value={connectionId}
                    onChange={(e) => setConnectionId(e.target.value)}
                    placeholder="Para forzar una conexión concreta"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                  >
                    {creating ? "Creando..." : "Crear"}
                  </button>

                  {createMsg && <p className="text-sm">{createMsg}</p>}

                  {/* Enlace directo al evento recién creado, forzando la cuenta de empresa */}
                  {createdHtmlLink && (
                    <a
                      className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm"
                      href={buildCalendarOpenLink(createdHtmlLink, workEmail || undefined, calendarId || undefined)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Abrir en Google Calendar
                    </a>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
