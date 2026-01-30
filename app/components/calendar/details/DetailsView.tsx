// app/components/calendar/details/DetailsView.tsx
"use client";

import { useMemo } from "react";

type PaintedAssignment = {
  employeeIds: string[];
  shiftLabel: string;
  startMin?: number;
  endMin?: number;
};

function minsToHHMM(m: number) {
  const hh = String(Math.floor(m / 60)).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function parseDayKeyFromCellId(cellId: string): string {
  const ix = cellId.indexOf("|");
  if (ix === -1) return cellId;
  return cellId.slice(0, ix);
}

function fmtDayHeaderFromDayKey(dayKey: string) {
  const parts = dayKey.split("-");
  if (parts.length !== 3) return dayKey;

  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);

  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return dayKey;

  const dt = new Date(y, m - 1, d);

  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(dt);
}

export default function DetailsView({
  locationId,
  selectedDayKey,
  painted,
  employeeNameById,
  employeeRoleNameById,
}: {
  locationId: string | null;
  selectedDayKey: string; // ✅ siempre definido (hoy por defecto)
  painted: Map<string, PaintedAssignment>;
  employeeNameById: (id: string) => string;
  employeeRoleNameById?: (id: string) => string;
}) {
  const items = useMemo(() => {
    const out: Array<{ key: string; a: PaintedAssignment }> = [];

    for (const [k, a] of painted) {
      const dayKey = parseDayKeyFromCellId(k);
      if (dayKey !== selectedDayKey) continue;
      out.push({ key: k, a });
    }

    out.sort((A, B) => (A.key < B.key ? -1 : A.key > B.key ? 1 : 0));
    return out;
  }, [painted, selectedDayKey]);

  const header = fmtDayHeaderFromDayKey(selectedDayKey);

  return (
    <aside className="h-full w-[320px] rounded-2xl border border-border bg-white overflow-hidden flex flex-col">
      <div className="border-b border-border px-4 py-3">
        <div className="text-sm font-semibold">Detalles del día</div>
        <div className="text-xs text-muted-foreground mt-0.5">{header}</div>
      </div>

      <div className="flex-1 overflow-auto px-4 py-3 space-y-3">
        {!locationId ? (
          <div className="text-sm text-muted-foreground">Selecciona una ubicación.</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted-foreground">No hay eventos pintados ese día.</div>
        ) : (
          items.map(({ key, a }) => {
            const timeText =
              Number.isFinite(a.startMin) && Number.isFinite(a.endMin)
                ? `${minsToHHMM(a.startMin as number)}–${minsToHHMM(a.endMin as number)}`
                : "";

            return (
              <div key={key} className="rounded-xl border border-border p-3">
                <div className="text-xs text-muted-foreground">{key}</div>

                <div className="mt-2 space-y-1">
                  {a.employeeIds.map((id) => {
                    const name = employeeNameById(id);
                    let role = "";
                    if (employeeRoleNameById) role = employeeRoleNameById(id);

                    return (
                      <div key={id} className="text-sm font-medium">
                        {role ? `${name} · ${role}` : name}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-2 text-sm">
                  <div className="font-semibold">{a.shiftLabel}</div>
                  {timeText ? <div className="text-xs text-muted-foreground">{timeText}</div> : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
