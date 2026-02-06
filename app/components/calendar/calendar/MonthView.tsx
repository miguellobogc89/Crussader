"use client";

import { useMemo } from "react";

import BankHolidayCell from "@/app/components/calendar/calendar/BankHolidayCell";
import CalendarHeaderRow from "@/app/components/calendar/calendar/Grid/CalendarHeaderRow";
import { fmtParts, localKeyTZ } from "./tz";

import type { CalendarAppt, HolidayLite } from "./types";
import type { CellPainter } from "@/hooks/calendar/useCellPainter";

type PaintedAssignment = {
  employeeIds: string[];
  shiftLabel: string;
};

type Props = {
  anchor: Date;
  appts: CalendarAppt[];
  onSelect?: (id: string) => void;
  onEdit?: (id: string) => void;

  painter: CellPainter;
  holidays?: HolidayLite[];

  painted?: Map<string, PaintedAssignment>;
  employeeNameById?: (id: string) => string;
  employeeColorById?: (id: string) => string | null;
};

export default function MonthView({
  anchor,
  appts,
  onSelect,
  onEdit,
  painter,
  holidays = [],
  painted,
  employeeNameById,
  employeeColorById,
}: Props) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);

  const start = (() => {
    const s = new Date(first);
    const dow = s.getDay(); // 0=Dom
    const delta = dow === 0 ? -6 : 1 - dow; // lunes
    s.setDate(s.getDate() + delta);
    s.setHours(0, 0, 0, 0);
    return s;
  })();

  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });

  const weekdayHeaderDays = useMemo(() => {
    const base = new Date(start);
    const out: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      out.push(d);
    }
    return out;
  }, [start]);

  const byKey = new Map<string, CalendarAppt[]>();
  for (const a of appts) {
    const k = localKeyTZ(new Date(a.startAt));
    const list = byKey.get(k) ?? [];
    list.push(a);
    byKey.set(k, list);
  }
  for (const [k, list] of byKey) {
    list.sort((A, B) => +new Date(A.startAt) - +new Date(B.startAt));
    byKey.set(k, list);
  }

  const holidaysByDay = new Map<string, HolidayLite[]>();
  for (const h of holidays) {
    const k = localKeyTZ(new Date(h.date));
    const list = holidaysByDay.get(k) ?? [];
    list.push(h);
    holidaysByDay.set(k, list);
  }

  function inMonth(d: Date) {
    return d.getMonth() === anchor.getMonth();
  }

  const todayKey = localKeyTZ(new Date());

  function getEmpName(id: string) {
    if (!employeeNameById) return id;
    const name = employeeNameById(id);
    if (!name) return id;
    return name;
  }

  function getEmpColor(id: string) {
    if (!employeeColorById) return null;
    const c = employeeColorById(id);
    if (!c) return null;
    return c;
  }

  // ✅ intenta varias keys del mismo día (por si tu sistema de pintado usa otro sufijo)
  function getAssignmentForDay(dayKey: string) {
    if (!painted) return null;

    const direct = painted.get(`${dayKey}|day`);
    if (direct) return direct;

    for (const [k, v] of painted) {
      if (k.startsWith(dayKey + "|")) return v;
    }

    return null;
  }

  function renderAssignment(dayKey: string) {
    const a = getAssignmentForDay(dayKey);
    if (!a) return null;

    const names = a.employeeIds.map(getEmpName);

    const dots = a.employeeIds
      .map((id) => getEmpColor(id))
      .filter((x) => Boolean(x)) as string[];

    return (
      <div className="relative mt-1">
        <div className="max-w-full rounded-md bg-slate-900/5 px-2 py-1 text-[10px] font-medium text-slate-700">
          {/* Arriba: empleados */}
          <div className="flex items-center gap-2 min-w-0">
            {dots.length > 0 ? (
              <span className="inline-flex items-center gap-1 shrink-0">
                {dots.slice(0, 6).map((c, idx) => (
                  <span
                    key={`${dayKey}-dot-${idx}`}
                    aria-hidden
                    className="h-2.5 w-2.5 rounded-full ring-1 ring-border"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </span>
            ) : null}

            <span className="truncate">{names.join(", ")}</span>
          </div>

          {/* Abajo: turno */}
          <div className="mt-0.5 text-[10px] text-slate-500 truncate">
            {a.shiftLabel}
          </div>
        </div>
      </div>
    );
  }

  // ✅ debug visible (no consola)
  const paintedSize = painted ? painted.size : 0;
  let sampleKey = "";
  if (painted && painted.size > 0) {
    const it = painted.keys().next();
    if (!it.done) sampleKey = String(it.value);
  }

  return (
    <div className="relative">
      <div className="pointer-events-none absolute right-3 top-3 z-20 rounded-md bg-black/70 px-2 py-1 text-[11px] text-white">
        painted={paintedSize}
        {sampleKey ? ` · sample=${sampleKey}` : ""}
      </div>

      <CalendarHeaderRow
        days={weekdayHeaderDays}
        fmtDay={new Intl.DateTimeFormat("es-ES")}
        isToday={() => false}
        isHoliday={() => false}
        holidayTitle={() => ""}
        showHourGutter={false}
        mode="weekday"
      />

      <div className="px-3 pb-3">
        <div className="grid grid-cols-7 border border-border divide-x divide-y divide-border bg-white">
          {days.map((d) => {
            const dayKey = localKeyTZ(d);
            const list = byKey.get(dayKey) ?? [];
            const isToday = dayKey === todayKey;

            const holidayList = holidaysByDay.get(dayKey) ?? [];
            const isHoliday = holidayList.length > 0;
            const holidayTitle = holidayList.map((x) => x.name).join(" · ");

            const cellId = `${dayKey}|day`;
            const overlayClass = painter.getOverlayClass(cellId);
            const overlayHandlers = painter.getCellHandlers(cellId);

            return (
              <div
                key={dayKey}
                className={[
                  "relative min-h-24 p-2",
                  inMonth(d) ? "" : "bg-slate-50/50",
                  isHoliday ? "bg-amber-50/40" : "",
                  isToday ? "bg-rose-100/60" : "",
                ].join(" ")}
              >
                <div className={overlayClass} style={{ inset: 0 }} {...overlayHandlers} />

                <div className="relative mb-1 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-muted-foreground">{d.getDate()}</div>
                  <BankHolidayCell visible={isHoliday} title={holidayTitle} />
                </div>

                {renderAssignment(dayKey)}

                <div className="relative mt-2 space-y-1">
                  {list.slice(0, 3).map((a) => (
                    <MiniAppt key={a.id} appt={a} onSelect={onSelect} onEdit={onEdit} />
                  ))}
                  {list.length > 3 ? (
                    <div className="text-[11px] text-muted-foreground">+{list.length - 3} más</div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MiniAppt({
  appt,
  onSelect,
  onEdit,
}: {
  appt: CalendarAppt;
  onSelect?: (id: string) => void;
  onEdit?: (id: string) => void;
}) {
  const d = new Date(appt.startAt);
  const parts = fmtParts(d, { hour: "2-digit", minute: "2-digit" });
  const hh = parts.find((p) => p.type === "hour")?.value ?? "00";
  const mm = parts.find((p) => p.type === "minute")?.value ?? "00";
  const time = `${hh}:${mm}`;

  return (
    <button
      onClick={() => onSelect?.(appt.id)}
      onDoubleClick={() => onEdit?.(appt.id)}
      className="w-full rounded-md px-2 py-1 text-left text-[11px] ring-1 ring-black/5 hover:opacity-95"
      style={{
        background: appt.serviceColor && !appt.serviceColor.startsWith("#") ? appt.serviceColor : undefined,
        backgroundColor: appt.serviceColor?.startsWith("#")
          ? appt.serviceColor
          : "rgba(124,58,237,0.12)",
      }}
      title={appt.serviceName ?? "Cita"}
    >
      <span className="font-medium">{time}</span>{" "}
      <span className="truncate">{appt.serviceName ?? "Cita"}</span>
    </button>
  );
}
