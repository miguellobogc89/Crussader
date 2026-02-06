// app/components/calendar/calendar/MonthView.tsx
"use client";

import { useMemo } from "react";

import BankHolidayCell from "@/app/components/calendar/calendar/BankHolidayCell";
import CalendarHeaderRow from "@/app/components/calendar/calendar/Grid/CalendarHeaderRow";
import { fmtParts, localKeyTZ } from "./tz";

import type { CalendarAppt, HolidayLite } from "./types";

type Props = {
  anchor: Date;
  appts: CalendarAppt[];
  onSelect?: (id: string) => void;
  onEdit?: (id: string) => void;

  holidays?: HolidayLite[];

  // Igual idea que week/day: celda clicable + selección
  onCellClick?: (cellId: string) => void; // dayKey|day
  selectedCellId?: string | null;
};

export default function MonthView({
  anchor,
  appts,
  onSelect,
  onEdit,
  holidays = [],
  onCellClick,
  selectedCellId,
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

  // citas por día (solo por startAt, sin inventar campos)
  const byKey = new Map<string, CalendarAppt[]>();
  for (const a of appts) {
    const k = localKeyTZ(new Date(a.startAt));
    const list = byKey.get(k);
    if (list) list.push(a);
    else byKey.set(k, [a]);
  }
  for (const [k, list] of byKey) {
    list.sort((A, B) => +new Date(A.startAt) - +new Date(B.startAt));
    byKey.set(k, list);
  }

  // festivos por día
  const holidaysByDay = new Map<string, HolidayLite[]>();
  for (const h of holidays) {
    const k = localKeyTZ(new Date(h.date));
    const list = holidaysByDay.get(k);
    if (list) list.push(h);
    else holidaysByDay.set(k, [h]);
  }

  function inMonth(d: Date) {
    return d.getMonth() === anchor.getMonth();
  }

  function isWeekend(d: Date) {
    const day = d.getDay();
    return day === 0 || day === 6;
  }

  const todayKey = localKeyTZ(new Date());

return (
  <div className="relative h-full min-h-0 flex flex-col">
    {/* HEADER igual que Week */}
    <div className="sticky top-0 z-30 bg-slate-50">
      <CalendarHeaderRow
        days={weekdayHeaderDays}
        fmtDay={new Intl.DateTimeFormat("es-ES", { weekday: "short" })}
        isToday={() => false}
        isHoliday={() => false}
        holidayTitle={() => ""}
        showHourGutter={false}
        mode="weekday"
      />
    </div>

    {/* BODY (sin borde externo para evitar doble con el header) */}
    <div className="flex-1 min-h-0 px-3 pb-3 pt-0">
      <div className="grid grid-cols-7 divide-x divide-y divide-border bg-white border-t-0">
        {days.map((d) => {
          const dayKey = localKeyTZ(d);
          const list = byKey.get(dayKey) ?? [];
          const isToday = dayKey === todayKey;

          const holidayList = holidaysByDay.get(dayKey) ?? [];
          const isHoliday = holidayList.length > 0;
          const holidayTitle = holidayList.map((x) => x.name).join(" · ");

          const cellId = `${dayKey}|day`;
          const isSelected = selectedCellId === cellId;

          return (
            <div
              key={cellId}
              className={[
                "relative min-h-24 p-2",
                inMonth(d) ? "bg-white" : "bg-slate-50/50",
                isWeekend(d) ? "bg-slate-50" : "",
                isHoliday ? "bg-amber-50/40" : "",
                isToday ? "bg-rose-100/60" : "",
              ].join(" ")}
            >
              {/* overlay clicable (como week/day) */}
              <button
                type="button"
                className={[
                  "absolute inset-0",
                  "hover:bg-slate-900/5",
                  isSelected ? "bg-slate-900/10 ring-1 ring-slate-900/10" : "",
                ].join(" ")}
                onClick={() => {
                  if (onCellClick) onCellClick(cellId);
                }}
                aria-label={dayKey}
              />

              <div className="relative mb-1 flex items-center justify-between gap-2">
                <div className="text-[11px] text-muted-foreground">{d.getDate()}</div>
                <BankHolidayCell visible={isHoliday} title={holidayTitle} />
              </div>

              <div className="relative mt-2 space-y-1">
                {list.slice(0, 3).map((a) => (
                  <MiniAppt key={a.id} appt={a} onSelect={onSelect} onEdit={onEdit} />
                ))}
                {list.length > 3 ? (
                  <div className="text-[11px] text-muted-foreground">
                    +{list.length - 3} más
                  </div>
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
      onClick={() => {
        if (onSelect) onSelect(appt.id);
      }}
      onDoubleClick={() => {
        if (onEdit) onEdit(appt.id);
      }}
      className="w-full rounded-md px-2 py-1 text-left text-[11px] ring-1 ring-black/5 hover:opacity-95 bg-[rgba(124,58,237,0.12)]"
      title={appt.serviceName ?? "Cita"}
    >
      <span className="font-medium">{time}</span>{" "}
      <span className="truncate">{appt.serviceName ?? "Cita"}</span>
    </button>
  );
}
