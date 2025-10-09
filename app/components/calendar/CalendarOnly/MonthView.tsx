"use client";

import { fmtParts, localKeyTZ } from "./tz";
import type { CalendarAppt } from "./types";

type Props = {
  anchor: Date;
  appts: CalendarAppt[];
  onSelect?: (id: string) => void;
  onEdit?: (id: string) => void;
};

export default function MonthView({ anchor, appts, onSelect, onEdit }: Props) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const start = (() => {
    const s = new Date(first);
    const dow = s.getDay(); // 0=Dom
    const delta = dow === 0 ? -6 : 1 - dow;
    s.setDate(s.getDate() + delta);
    s.setHours(0, 0, 0, 0);
    return s;
  })();
  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });

  // Agrupa por clave local (TZ)
  const byKey = new Map<string, CalendarAppt[]>();
  for (const a of appts) {
    const k = localKeyTZ(new Date(a.startAt));
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k)!.push(a);
  }
  for (const [k, list] of byKey) {
    list.sort((A, B) => +new Date(A.startAt) - +new Date(B.startAt));
    byKey.set(k, list);
  }

  const inMonth = (d: Date) => d.getMonth() === anchor.getMonth();
  const todayKey = localKeyTZ(new Date());

  return (
    <div className="grid grid-cols-7 gap-[6px]">
      {["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map((h)=>(
        <div key={h} className="text-xs text-muted-foreground px-1 py-1">{h}</div>
      ))}
      {days.map((d) => {
        const k = localKeyTZ(d);
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
                <MiniAppt key={a.id} appt={a} onSelect={onSelect} onEdit={onEdit} />
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

function MiniAppt({
  appt, onSelect, onEdit,
}: { appt: CalendarAppt; onSelect?: (id: string) => void; onEdit?: (id: string) => void; }) {
  const d = new Date(appt.startAt);
  const parts = fmtParts(d, { hour: "2-digit", minute: "2-digit" });
  const hh = parts.find(p => p.type === "hour")?.value ?? "00";
  const mm = parts.find(p => p.type === "minute")?.value ?? "00";
  const time = `${hh}:${mm}`;

  return (
    <button
      onClick={() => onSelect?.(appt.id)}
      onDoubleClick={() => onEdit?.(appt.id)}
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
