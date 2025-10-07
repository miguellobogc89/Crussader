// app/components/calendar/CalendarOnly.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/app/components/ui/button";

export type CalendarAppt = {
  id: string;
  startAt: string; // ISO
  endAt: string;   // ISO
  serviceName?: string | null;
  serviceColor?: string | null;
  employeeName?: string | null;
  resourceName?: string | null;
};

type View = "day" | "week" | "month";

type Props = {
  selectedView: View;
  onChangeView: (v: View) => void;
  selectedDate: Date;
  onChangeDate: (d: Date) => void;
  appointments?: CalendarAppt[];
  onSelectAppointment?: (id: string) => void;
};

export default function CalendarOnly({
  selectedView,
  onChangeView,
  selectedDate,
  onChangeDate,
  appointments = [],
  onSelectAppointment,
}: Props) {
  // estado interno sincronizado con la prop (controlado)
  const [view, setView] = useState<View>(selectedView);
  useEffect(() => setView(selectedView), [selectedView]);

  // helpers fecha
  const startOfWeekMon = (d: Date) => {
    const x = new Date(d);
    const day = x.getDay(); // 0=Dom
    const delta = (day === 0 ? -6 : 1 - day);
    x.setHours(0, 0, 0, 0);
    x.setDate(x.getDate() + delta);
    return x;
  };
  const addDays = (d: Date, n: number) => {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  };
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  // rango semana visible
  const weekStart = useMemo(() => startOfWeekMon(selectedDate), [selectedDate]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  // navegación por vista
  function goPrev() {
    const d = new Date(selectedDate);
    if (view === "day") d.setDate(d.getDate() - 1);
    else if (view === "week") d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    onChangeDate(d);
  }
  function goNext() {
    const d = new Date(selectedDate);
    if (view === "day") d.setDate(d.getDate() + 1);
    else if (view === "week") d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    onChangeDate(d);
  }
  function goToday() {
    const now = new Date();
    onChangeDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
  }
  function handleChangeView(v: View) {
    setView(v);
    onChangeView?.(v);
    // al pasar a semana, alinear a lunes
    if (v === "week") onChangeDate(startOfWeekMon(selectedDate));
  }

  // formateadores
  const fmtDay = useMemo(
    () => new Intl.DateTimeFormat("es-ES", { weekday: "short", day: "2-digit", month: "short" }),
    []
  );
  const fmtHour = useMemo(
    () => new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" }),
    []
  );
  const monthTitle = useMemo(
    () => new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(selectedDate),
    [selectedDate]
  );

  // citas por día (para día/semana)
  const apptsByDay = useMemo(() => {
    const map = new Map<string, CalendarAppt[]>();
    const keyOf = (d: Date) => d.toISOString().slice(0, 10);
    for (const a of appointments) {
      const d = new Date(a.startAt);
      const k = keyOf(d);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(a);
    }
    for (const [k, list] of map) {
      list.sort((A, B) => +new Date(A.startAt) - +new Date(B.startAt));
      map.set(k, list);
    }
    return map;
  }, [appointments]);

  // ============ UI HEADER ============
  return (
    <div className="flex h-full w-full flex-col">
      {/* Controles */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goPrev}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" onClick={goToday}>Hoy</Button>
          <Button variant="outline" size="icon" onClick={goNext}><ChevronRight className="h-4 w-4" /></Button>
          <div className="ml-3 text-sm font-medium capitalize">{monthTitle}</div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={view === "day" ? "default" : "outline"}
            onClick={() => handleChangeView("day")}
          >
            Día
          </Button>
          <Button
            variant={view === "week" ? "default" : "outline"}
            onClick={() => handleChangeView("week")}
          >
            Semana
          </Button>
          <Button
            variant={view === "month" ? "default" : "outline"}
            onClick={() => handleChangeView("month")}
          >
            Mes
          </Button>
        </div>
      </div>

      {/* Contenido */}
      <div className="min-h-0 flex-1 rounded-lg border bg-background p-3">
        {view === "day" && (
          <DayView
            date={selectedDate}
            appts={apptsByDay.get(selectedDate.toISOString().slice(0, 10)) ?? []}
            onSelect={onSelectAppointment}
            fmtHour={fmtHour}
          />
        )}

        {view === "week" && (
          <WeekView
            days={weekDays}
            apptsByDay={apptsByDay}
            onSelect={onSelectAppointment}
            fmtDay={fmtDay}
            fmtHour={fmtHour}
            isToday={(d) => sameDay(d, new Date())}
          />
        )}

        {view === "month" && (
          <MonthView
            anchor={selectedDate}
            appts={appointments}
            onSelect={onSelectAppointment}
            fmtDay={fmtDay}
          />
        )}
      </div>
    </div>
  );
}

/* ===================== Día ===================== */

function DayView({
  date,
  appts,
  onSelect,
  fmtHour,
}: {
  date: Date;
  appts: CalendarAppt[];
  onSelect?: (id: string) => void;
  fmtHour: Intl.DateTimeFormat;
}) {
  const hours = Array.from({ length: 12 }, (_, i) => 8 + i); // 08..19
  const apptsSorted = [...appts].sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt));

  return (
    <div className="grid grid-cols-[64px_1fr] gap-2 h-full">
      <div className="flex flex-col">
        {hours.map((h) => (
          <div key={h} className="h-16 text-xs text-muted-foreground">{String(h).padStart(2, "0")}:00</div>
        ))}
      </div>
      <div className="relative">
        {/* líneas de hora */}
        {hours.map((h) => (
          <div key={h} className="h-16 border-t border-dashed border-border/60" />
        ))}
        {/* tarjetas */}
        <div className="absolute inset-0 p-1">
          {apptsSorted.map((a) => (
            <ApptCard key={a.id} appt={a} onSelect={onSelect} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ===================== Semana ===================== */

function WeekView({
  days,
  apptsByDay,
  onSelect,
  fmtDay,
  fmtHour,
  isToday,
}: {
  days: Date[];
  apptsByDay: Map<string, CalendarAppt[]>;
  onSelect?: (id: string) => void;
  fmtDay: Intl.DateTimeFormat;
  fmtHour: Intl.DateTimeFormat;
  isToday: (d: Date) => boolean;
}) {
  const hours = Array.from({ length: 12 }, (_, i) => 8 + i); // 08..19

  return (
    <div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))] gap-2 h-full">
      {/* columna horas */}
      <div className="flex flex-col">
        <div className="h-10" />
        {hours.map((h) => (
          <div key={h} className="h-16 text-xs text-muted-foreground">{String(h).padStart(2, "0")}:00</div>
        ))}
      </div>

      {days.map((d) => {
        const key = d.toISOString().slice(0, 10);
        const list = (apptsByDay.get(key) ?? []).sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt));
        return (
          <div key={key} className="min-w-0">
            {/* header día */}
            <div className={`h-10 flex items-center justify-center rounded-md text-xs font-medium ${isToday(d) ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
              {fmtDay.format(d)}
            </div>
            {/* grid del día */}
            <div className="relative">
              {hours.map((h) => (
                <div key={h} className="h-16 border-t border-dashed border-border/60" />
              ))}
              <div className="absolute inset-0 p-1 space-y-2">
                {list.map((a) => (
                  <ApptCard key={a.id} appt={a} onSelect={onSelect} />
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ===================== Mes ===================== */

function MonthView({
  anchor,
  appts,
  onSelect,
  fmtDay,
}: {
  anchor: Date;
  appts: CalendarAppt[];
  onSelect?: (id: string) => void;
  fmtDay: Intl.DateTimeFormat;
}) {
  // construir matriz 6x7 (estándar)
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const start = (() => {
    const s = new Date(first);
    const dow = s.getDay(); // 0=Dom
    const delta = (dow === 0 ? -6 : 1 - dow);
    s.setDate(s.getDate() + delta);
    s.setHours(0, 0, 0, 0);
    return s;
  })();
  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });

  const byKey = new Map<string, CalendarAppt[]>();
  for (const a of appts) {
    const k = a.startAt.slice(0, 10);
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k)!.push(a);
  }
  for (const [k, list] of byKey) {
    list.sort((A, B) => +new Date(A.startAt) - +new Date(B.startAt));
    byKey.set(k, list);
  }

  const inMonth = (d: Date) => d.getMonth() === anchor.getMonth();
  const todayKey = new Date().toISOString().slice(0, 10);

  return (
    <div className="grid grid-cols-7 gap-[6px]">
      {["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map((h)=>(
        <div key={h} className="text-xs text-muted-foreground px-1 py-1">{h}</div>
      ))}
      {days.map((d) => {
        const k = d.toISOString().slice(0, 10);
        const list = byKey.get(k) ?? [];
        const isToday = k === todayKey;
        return (
          <div
            key={k}
            className={`min-h-24 rounded-md border p-1 ${inMonth(d) ? "" : "opacity-60"} ${isToday ? "ring-2 ring-primary/40" : ""}`}
          >
            <div className="mb-1 flex items-center justify-between">
              <div className={`text-[11px] ${isToday ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                {d.getDate()}
              </div>
            </div>
            <div className="space-y-1">
              {list.slice(0, 3).map((a) => (
                <MiniAppt key={a.id} appt={a} onSelect={onSelect} />
              ))}
              {list.length > 3 && (
                <div className="text-[11px] text-muted-foreground">+{list.length - 3} más</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ===================== Tarjetas ===================== */

function ApptCard({ appt, onSelect }: { appt: CalendarAppt; onSelect?: (id: string) => void }) {
  const start = new Date(appt.startAt);
  const end = new Date(appt.endAt);
  const time = `${pad2(start.getHours())}:${pad2(start.getMinutes())}–${pad2(end.getHours())}:${pad2(end.getMinutes())}`;
  const bg =
    appt.serviceColor && appt.serviceColor.startsWith("#")
      ? appt.serviceColor
      : undefined;

  return (
    <button
      onClick={() => onSelect?.(appt.id)}
      className="w-full rounded-xl px-3 py-2 text-left text-xs shadow-sm ring-1 ring-black/5 hover:opacity-95 transition"
      style={{
        background: appt.serviceColor && !appt.serviceColor.startsWith("#")
          ? appt.serviceColor
          : undefined,
        backgroundColor: bg ?? "rgba(124,58,237,0.12)", // fallback morado suave
      }}
      title={appt.serviceName ?? "Cita"}
    >
      <div className="font-medium truncate">{appt.serviceName ?? "Cita"}</div>
      <div className="opacity-80">{time}</div>
      {appt.employeeName && <div className="opacity-70 truncate">{appt.employeeName}</div>}
      {appt.resourceName && <div className="opacity-60 truncate">{appt.resourceName}</div>}
    </button>
  );
}

function MiniAppt({ appt, onSelect }: { appt: CalendarAppt; onSelect?: (id: string) => void }) {
  const start = new Date(appt.startAt);
  const time = `${pad2(start.getHours())}:${pad2(start.getMinutes())}`;
  return (
    <button
      onClick={() => onSelect?.(appt.id)}
      className="w-full rounded-md px-2 py-1 text-left text-[11px] ring-1 ring-black/5 hover:opacity-95"
      style={{
        background: appt.serviceColor && !appt.serviceColor.startsWith("#")
          ? appt.serviceColor
          : undefined,
        backgroundColor: appt.serviceColor?.startsWith("#") ? appt.serviceColor : "rgba(124,58,237,0.12)",
      }}
      title={appt.serviceName ?? "Cita"}
    >
      <span className="font-medium">{time}</span>{" "}
      <span className="truncate">{appt.serviceName ?? "Cita"}</span>
    </button>
  );
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
