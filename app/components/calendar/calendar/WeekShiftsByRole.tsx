// app/components/calendar/calendar/WeekShiftsByRole.tsx
"use client";

import ShiftEventBlock from "@/app/components/calendar/calendar/ShiftEventBlock";
import { localKeyTZ } from "./tz";

type ShiftEventLite = {
  id: string;
  employeeId: string | null;
  locationId: string | null;
  startAt: string;
  endAt: string;
  kind: string;
  label: string | null;
  templateId: string | null;

  roleId?: string | null;
  roleName?: string | null;
  roleColor?: string | null;
};

type Props = {
  dayKey: string;
  START_HOUR: number;
  HOURS_COUNT: number;
  ROW_PX: number;

  shiftEvents: ShiftEventLite[];
};

const MAX_COLUMNS = 3;

function clamp(n: number, min: number, max: number) {
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

function minutesFromMidnightLocal(d: Date) {
  return d.getHours() * 60 + d.getMinutes();
}

type RawBlock = {
  roleKey: string; // roleId o roleName
  roleName: string;
  roleColor: string | null;
  startMin: number;
  endMin: number;
};

type Segment = {
  startMin: number;
  endMin: number;
  roles: Map<string, { name: string; color: string | null; count: number }>;
};

export default function WeekShiftsByRole({
  dayKey,
  START_HOUR,
  HOURS_COUNT,
  ROW_PX,
  shiftEvents,
}: Props) {
  const startHourMin = START_HOUR * 60;
  const endHourMin = (START_HOUR + HOURS_COUNT) * 60;

  // 1) normalizar eventos del día a "rol"
  const raw: RawBlock[] = [];

  for (const ev of shiftEvents) {
    const start = new Date(ev.startAt);
    const end = new Date(ev.endAt);

    if (localKeyTZ(start) !== dayKey) continue;

    const s0 = minutesFromMidnightLocal(start);
    const e0 = minutesFromMidnightLocal(end);

    const s = clamp(s0, startHourMin, endHourMin);
    const e = clamp(e0, startHourMin, endHourMin);
    if (e <= s) continue;

    const roleName =
      ev.roleName && String(ev.roleName).trim().length > 0
        ? String(ev.roleName).trim()
        : "Sin rol";

    const roleKey =
      ev.roleId && String(ev.roleId).trim().length > 0
        ? String(ev.roleId).trim()
        : roleName;

    const roleColor =
      ev.roleColor && String(ev.roleColor).trim().length > 0
        ? String(ev.roleColor).trim()
        : null;

    raw.push({ roleKey, roleName, roleColor, startMin: s, endMin: e });
  }

  if (raw.length === 0) return null;

  // 2) cortes del timeline
  const cuts = new Set<number>();
  for (const r of raw) {
    cuts.add(r.startMin);
    cuts.add(r.endMin);
  }
  const times = Array.from(cuts).sort((a, b) => a - b);

  // 3) segmentos por tramo
  const segments: Segment[] = [];

  for (let i = 0; i < times.length - 1; i += 1) {
    const segStart = times[i];
    const segEnd = times[i + 1];
    if (segEnd <= segStart) continue;

    const roles = new Map<string, { name: string; color: string | null; count: number }>();

    for (const r of raw) {
      if (r.startMin < segEnd && r.endMin > segStart) {
        const existing = roles.get(r.roleKey);
        if (existing) {
          existing.count += 1;
        } else {
          roles.set(r.roleKey, { name: r.roleName, color: r.roleColor, count: 1 });
        }
      }
    }

    if (roles.size > 0) segments.push({ startMin: segStart, endMin: segEnd, roles });
  }

  // 4) render por segmento
  return (
    <>
      {segments.map((seg, idx) => {
        const entries = Array.from(seg.roles.entries()); // [roleKey, {name,color,count}]
        const roleCount = entries.length;

        const top = ((seg.startMin / 60) - START_HOUR) * ROW_PX;
        const height = ((seg.endMin - seg.startMin) / 60) * ROW_PX;

        // ---- COLAPSO: por nº de roles (no por empleados) ----
        if (roleCount > MAX_COLUMNS) {
          const totalEmployees = entries.reduce((a, [, v]) => a + v.count, 0);

          return (
            <ShiftEventBlock
              key={`seg-${idx}`}
              top={top}
              height={height}
              leftPct={0}
              widthPct={100}
              title={`+${roleCount} roles`}
              subtitle={String(totalEmployees)}
              color={null}
              onClick={() => {}}
            />
          );
        }

        // ---- PARALELO (≤3 roles) ----
        const widthPct = 100 / roleCount;

        return entries.map(([roleKey, v], col) => (
          <ShiftEventBlock
            key={`seg-${idx}-${roleKey}`}
            top={top}
            height={height}
            leftPct={col * widthPct}
            widthPct={widthPct}
            title={v.name}
            subtitle={String(v.count)}
            color={v.color}
            onClick={() => {}}
          />
        ));
      })}
    </>
  );
}
