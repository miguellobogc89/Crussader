// app/components/calendar/calendar/WeekShiftsByEmployee.tsx
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

  // ✅ opcional (si ya lo estás trayendo en el endpoint)
  roleColor?: string | null;
};

type Props = {
  dayKey: string;
  START_HOUR: number;
  HOURS_COUNT: number;
  ROW_PX: number;

  employeeNameById?: (id: string) => string;

  shiftEvents: ShiftEventLite[];
};

function clamp(n: number, min: number, max: number) {
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

function minutesFromMidnightLocal(d: Date) {
  return d.getHours() * 60 + d.getMinutes();
}

type Block = {
  id: string;
  employeeId: string;
  kind: string;
  label: string | null;
  startMin: number;
  endMin: number;

  roleColor: string | null;
};

type PositionedBlock = Block & {
  lane: number;
  lanesCount: number;
};

export default function WeekShiftsByEmployee({
  dayKey,
  START_HOUR,
  HOURS_COUNT,
  ROW_PX,
  employeeNameById,
  shiftEvents,
}: Props) {
  function nameOfEmployee(id: string) {
    if (employeeNameById) return employeeNameById(id);
    return id;
  }

  const rawBlocks: Block[] = [];

  for (const ev of shiftEvents) {
    if (!ev.employeeId) continue;

    const start = new Date(ev.startAt);
    const end = new Date(ev.endAt);

    const evDayKey = localKeyTZ(start);
    if (evDayKey !== dayKey) continue;

    rawBlocks.push({
      id: ev.id,
      employeeId: String(ev.employeeId),
      kind: String(ev.kind ?? "WORK"),
      label: ev.label,
      startMin: minutesFromMidnightLocal(start),
      endMin: minutesFromMidnightLocal(end),
      roleColor: ev.roleColor && String(ev.roleColor).trim().length > 0 ? String(ev.roleColor).trim() : null,
    });
  }

  const startHourMin = START_HOUR * 60;
  const endHourMin = (START_HOUR + HOURS_COUNT) * 60;

  const blocks: Block[] = [];
  for (const b of rawBlocks) {
    const s = clamp(b.startMin, startHourMin, endHourMin);
    const e = clamp(b.endMin, startHourMin, endHourMin);
    if (e <= s) continue;
    blocks.push({ ...b, startMin: s, endMin: e });
  }

  blocks.sort((a, b) => {
    if (a.startMin < b.startMin) return -1;
    if (a.startMin > b.startMin) return 1;
    if (a.endMin < b.endMin) return -1;
    if (a.endMin > b.endMin) return 1;
    return 0;
  });

  // ===== grupos de solape → lanes por grupo (estable) =====
  const positioned: PositionedBlock[] = [];

  let group: Block[] = [];
  let groupEnd = -1;

  function flushGroup() {
    if (group.length === 0) return;

    const laneEnd: number[] = [];
    const withLane: PositionedBlock[] = [];

    for (const b of group) {
      let lane = -1;

      for (let i = 0; i < laneEnd.length; i += 1) {
        if (laneEnd[i] <= b.startMin) {
          lane = i;
          break;
        }
      }

      if (lane === -1) {
        lane = laneEnd.length;
        laneEnd.push(b.endMin);
      } else {
        laneEnd[lane] = b.endMin;
      }

      withLane.push({
        ...b,
        lane,
        lanesCount: 0,
      });
    }

    const lanesCount = laneEnd.length > 0 ? laneEnd.length : 1;

    for (const w of withLane) {
      w.lanesCount = lanesCount;
      positioned.push(w);
    }

    group = [];
    groupEnd = -1;
  }

  for (const b of blocks) {
    if (group.length === 0) {
      group.push(b);
      groupEnd = b.endMin;
      continue;
    }

    if (b.startMin < groupEnd) {
      group.push(b);
      if (b.endMin > groupEnd) groupEnd = b.endMin;
      continue;
    }

    flushGroup();
    group.push(b);
    groupEnd = b.endMin;
  }

  flushGroup();

  return (
    <>
      {positioned.map((b) => {
        const widthPct = 100 / b.lanesCount;
        const leftPct = b.lane * widthPct;

        const top = ((b.startMin / 60) - START_HOUR) * ROW_PX;
        const height = ((b.endMin - b.startMin) / 60) * ROW_PX;

        const title = nameOfEmployee(b.employeeId);
        const subtitle = b.label && b.label.trim().length > 0 ? b.label : null;

        return (
          <ShiftEventBlock
            key={b.id}
            top={top}
            height={height}
            leftPct={leftPct}
            widthPct={widthPct}
            title={title}
            subtitle={subtitle}
            color={b.roleColor}
            onClick={() => {}}
          />
        );
      })}
    </>
  );
}
