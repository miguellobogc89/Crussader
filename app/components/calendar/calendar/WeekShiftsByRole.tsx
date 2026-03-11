// app/components/calendar/calendar/WeekShiftsByRole.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ShiftEventBlock from "@/app/components/calendar/calendar/ShiftEventBlock";
import { localKeyTZ } from "./tz";
import {
  computeSegmentsFromBlocks,
  type LayoutBlock,
  type LayoutSegment,
} from "@/app/components/calendar/calendar/shiftBlockLayoutEngine";

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

  employeeNameById?: (id: string) => string;

  selectedShiftId?: string | null;
  onSelectShift?: (id: string) => void;
};

const SNAP_MIN = 15;
const MIN_DURATION_MIN = 15;

function clamp(n: number, min: number, max: number) {
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

function minutesFromMidnightLocal(d: Date) {
  return d.getHours() * 60 + d.getMinutes();
}

function snapMinutes(mins: number) {
  return Math.round(mins / SNAP_MIN) * SNAP_MIN;
}

function signatureFromLines(lines: string[] | undefined) {
  const a = Array.isArray(lines) ? lines.map((x) => String(x).trim()).filter(Boolean) : [];
  a.sort((x, y) => x.localeCompare(y, "es"));
  return a.join("|");
}

type RoleBlockModel = {
  key: string; // roleKey
  name: string;
  color: string | null;
  lines: string[];
  startMin: number;
  endMin: number;
};

type DragState = {
  key: string;
  edge: "top" | "bottom";
  baseStartMin: number;
  baseEndMin: number;
};

export default function WeekShiftsByRole({
  dayKey,
  START_HOUR,
  HOURS_COUNT,
  ROW_PX,
  shiftEvents,
  employeeNameById,
}: Props) {
  function nameOfEmployee(id: string) {
    if (!employeeNameById) return id;
    const n = String(employeeNameById(id) ?? "").trim();
    if (n.length > 0) return n;
    return id;
  }

  const startHourMin = START_HOUR * 60;
  const endHourMin = (START_HOUR + HOURS_COUNT) * 60;

  const baseRoleBlocks: RoleBlockModel[] = useMemo(() => {
    const byRole = new Map<
      string,
      { name: string; color: string | null; linesSet: Set<string>; startMin: number; endMin: number }
    >();

    for (const ev of shiftEvents) {
      if (!ev.employeeId) continue;

      const start = new Date(ev.startAt);
      const end = new Date(ev.endAt);

      if (localKeyTZ(start) !== dayKey) continue;

      const s0 = minutesFromMidnightLocal(start);
      const e0 = minutesFromMidnightLocal(end);

      const s = clamp(s0, startHourMin, endHourMin);
      const e = clamp(e0, startHourMin, endHourMin);
      if (e <= s) continue;

      const roleName =
        ev.roleName && String(ev.roleName).trim().length > 0 ? String(ev.roleName).trim() : "Sin rol";

      const roleKey =
        ev.roleId && String(ev.roleId).trim().length > 0 ? String(ev.roleId).trim() : roleName;

      const roleColor =
        ev.roleColor && String(ev.roleColor).trim().length > 0 ? String(ev.roleColor).trim() : null;

      const employeeId = String(ev.employeeId);
      const employeeName = nameOfEmployee(employeeId);

      const line = `${employeeName} · ${roleName}`;

      const existing = byRole.get(roleKey);
      if (!existing) {
        byRole.set(roleKey, {
          name: roleName,
          color: roleColor,
          linesSet: new Set<string>([line]),
          startMin: s,
          endMin: e,
        });
      } else {
        if (s < existing.startMin) existing.startMin = s;
        if (e > existing.endMin) existing.endMin = e;
        existing.linesSet.add(line);

        if (!existing.color && roleColor) existing.color = roleColor;
        if (!existing.name && roleName) existing.name = roleName;
      }
    }

    const out: RoleBlockModel[] = [];
    for (const [roleKey, v] of byRole.entries()) {
      const lines = Array.from(v.linesSet).sort((a, b) => a.localeCompare(b, "es"));
      out.push({
        key: roleKey,
        name: v.name,
        color: v.color,
        lines,
        startMin: v.startMin,
        endMin: v.endMin,
      });
    }

    out.sort((a, b) => {
      const n = a.name.localeCompare(b.name, "es");
      if (n !== 0) return n;
      return a.key.localeCompare(b.key, "es");
    });

    return out;
  }, [dayKey, shiftEvents, startHourMin, endHourMin, employeeNameById]);

  const [roleBlocks, setRoleBlocks] = useState<RoleBlockModel[]>([]);
  const roleBlocksRef = useRef<RoleBlockModel[]>([]);
  const dragRef = useRef<DragState | null>(null);

  // ✅ no useMemo para setState
  useEffect(() => {
    setRoleBlocks(baseRoleBlocks);
    roleBlocksRef.current = baseRoleBlocks;
  }, [baseRoleBlocks, dayKey]);

  function pxToSnappedMinutes(deltaPx: number) {
    const raw = (deltaPx / ROW_PX) * 60;
    return snapMinutes(raw);
  }

  function updateBlock(key: string, edge: "top" | "bottom", deltaPx: number) {
    const d = dragRef.current;
    if (!d) return;

    const deltaMin = pxToSnappedMinutes(deltaPx);

    setRoleBlocks((prev) => {
      const next = prev.map((b) => {
        if (b.key !== key) return b;

        let s = b.startMin;
        let e = b.endMin;

        if (edge === "top") {
          s = d.baseStartMin + deltaMin;
          s = clamp(s, startHourMin, endHourMin - MIN_DURATION_MIN);
          if (e - s < MIN_DURATION_MIN) s = e - MIN_DURATION_MIN;
        } else {
          e = d.baseEndMin + deltaMin;
          e = clamp(e, startHourMin + MIN_DURATION_MIN, endHourMin);
          if (e - s < MIN_DURATION_MIN) e = s + MIN_DURATION_MIN;
        }

        return { ...b, startMin: s, endMin: e };
      });

      roleBlocksRef.current = next;
      return next;
    });
  }

  const segments: LayoutSegment[] = useMemo(() => {
    const blocks: LayoutBlock[] = roleBlocksRef.current.length > 0 ? roleBlocksRef.current : roleBlocks;

    if (!blocks || blocks.length === 0) return [];

    const input: LayoutBlock[] = blocks.map((b) => ({
      key: b.key,
      startMin: b.startMin,
      endMin: b.endMin,
      name: b.name,
      color: b.color,
      lines: b.lines,
    }));

    return computeSegmentsFromBlocks(input, {
      clampMin: startHourMin,
      clampMax: endHourMin,
      mergeAdjacent: true,
    });
  }, [roleBlocks, startHourMin, endHourMin]);

  if (segments.length === 0) return null;

  return (
    <>
      {segments.map((seg, segIdx) => {
        const top = (seg.startMin / 60 - START_HOUR) * ROW_PX;
        const height = ((seg.endMin - seg.startMin) / 60) * ROW_PX;

        return seg.columns.map((c) => {
          // ✅ multi-empleado => permitimos resize siempre (según tu criterio)
          const lineCount = Array.isArray(c.lines) ? c.lines.length : 0;
          const isMultiEmployee = lineCount > 1;

          // ✅ si es 1 empleado: detectamos si el borde es interior (mismo rol + mismo empleado) con colindante
          const mySig = signatureFromLines(c.lines);

          const hasSameAbove =
            !isMultiEmployee &&
            segments.some((s) => {
              if (s.endMin !== seg.startMin) return false;
              const col = s.columns.find((x) => x.key === c.key);
              if (!col) return false;
              return signatureFromLines(col.lines) === mySig;
            });

          const hasSameBelow =
            !isMultiEmployee &&
            segments.some((s) => {
              if (s.startMin !== seg.endMin) return false;
              const col = s.columns.find((x) => x.key === c.key);
              if (!col) return false;
              return signatureFromLines(col.lines) === mySig;
            });

          const allowTop = !hasSameAbove;
          const allowBottom = !hasSameBelow;

          return (
            <ShiftEventBlock
              key={`seg-${segIdx}-${c.key}`}
              top={top}
              height={height}
              leftPct={c.leftPct}
              widthPct={c.widthPct}
              title={c.name}
              subtitle={"1"}
              color={c.color}
              lines={c.lines}
              onClick={() => {}}
              allowResizeTop={allowTop}
              allowResizeBottom={allowBottom}
              onResizeStart={(edge) => {
                const current = roleBlocksRef.current.find((b) => b.key === c.key);
                if (!current) return;

                dragRef.current = {
                  key: c.key,
                  edge,
                  baseStartMin: current.startMin,
                  baseEndMin: current.endMin,
                };
              }}
              onResizeMove={(edge, deltaPx) => {
                updateBlock(c.key, edge, deltaPx);
              }}
              onResizeEnd={() => {
                dragRef.current = null;
              }}
            />
          );
        });
      })}
    </>
  );
}
