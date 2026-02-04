// app/components/calendar/CalendarShell.tsx
"use client";

import { useMemo, useState } from "react";
import LocationSelector from "@/app/components/crussader/LocationSelector";
import ResourceView from "@/app/components/calendar/resources/ResourceView";
import CalendarView from "@/app/components/calendar/CalendarOnly/CalendarView";
import {
  applyPaintWeekLike,
  type PaintBlock,
} from "@/app/components/calendar/CalendarOnly/shiftPaintEngine";

import type {
  ShiftTypeValue,
  ShiftTemplateLite,
} from "@/app/components/calendar/resources/shift/ShiftList";
import type { Employee } from "@/app/components/calendar/resources/employees/EmployeeList";
import type { HolidayLite } from "@/app/components/calendar/CalendarOnly/types";
import type { Range } from "@/app/components/calendar/CalendarOnly/CalendarView";

const START_HOUR = 8;
const HOURS_COUNT = 12;

type PaintedAssignment = {
  employeeIds: string[];
  shiftLabel: string;
};

export default function CalendarShell() {
  const [locationId, setLocationId] = useState<string | null>(null);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [templates, setTemplates] = useState<ShiftTemplateLite[]>([]);

  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [shiftType, setShiftType] = useState<ShiftTypeValue>({
    templateId: "standard",
  });

  const [blocks, setBlocks] = useState<PaintBlock[]>([]);

  const [holidays] = useState<HolidayLite[]>([]);
  const [range, setRange] = useState<Range | null>(null);

  function employeeNameById(id: string) {
    const found = employees.find((e) => String(e.id) === String(id));
    if (found) return found.name;
    return id;
  }

  function employeeColorById(_id: string) {
    return null;
  }

  function resolveShiftLabel() {
    // estándar / ausencias (no vienen de templates API)
    const id = String(shiftType.templateId);

    if (id === "standard") return "Turno estándar";
    if (id === "abs_vacation") return "Vacaciones";
    if (id === "abs_sick") return "Baja";
    if (id === "abs_off") return "Permiso";

    const t = templates.find((x) => String(x.id) === id);
    if (t) return t.name;

    return "Turno";
  }

  function upsertPaint(cellId: string) {
    if (!locationId) return;
    if (selectedEmployeeIds.length === 0) return;

    setBlocks((prev) => {
      return applyPaintWeekLike({
        prevBlocks: prev,
        cellId,
        selectedEmployeeIds,
        shiftType,
        templates,
        START_HOUR,
        HOURS_COUNT,
        resolveLabel: resolveShiftLabel,
      });
    });
  }

  const paintedCellIds = useMemo(() => {
    const s = new Set<string>();

    for (const b of blocks) {
      const from = Math.max(0, b.startIndex);
      const to = Math.min(HOURS_COUNT, b.endIndex);

      for (let i = from; i < to; i += 1) {
        s.add(`${b.dayKey}|${i}`);
      }
    }

    return s;
  }, [blocks]);

  const painted = useMemo(() => {
    const m = new Map<string, PaintedAssignment>();

    for (const b of blocks) {
      const from = Math.max(0, b.startIndex);
      const to = Math.min(HOURS_COUNT, b.endIndex);

      for (let i = from; i < to; i += 1) {
        m.set(`${b.dayKey}|${i}`, {
          employeeIds: b.employeeIds,
          shiftLabel: b.label,
        });
      }
    }

    return m;
  }, [blocks]);

  return (
    <>
      <LocationSelector onSelect={(id) => setLocationId(id)} />

      <div className="flex min-h-[70vh] h-[calc(100vh-180px)] gap-4">
        <ResourceView
          locationId={locationId}
          selectedEmployeeIds={selectedEmployeeIds}
          onChangeSelectedEmployeeIds={setSelectedEmployeeIds}
          shiftType={shiftType}
          onChangeShiftType={setShiftType}
          onDataSnapshot={(s) => {
            setEmployees(s.employees);
            setTemplates(s.shiftTemplates);
          }}
        />

        <CalendarView
          locationId={locationId}
          holidays={holidays}
          paintedCellIds={paintedCellIds}
          onPaintCell={upsertPaint}
          painted={painted}
          employeeNameById={employeeNameById}
          employeeColorById={employeeColorById}
          onRangeChange={(next) => {
            setRange((prev) => {
              if (!prev) return next;
              if (prev.fromISO === next.fromISO && prev.toISO === next.toISO)
                return prev;
              return next;
            });
          }}
        />
      </div>
    </>
  );
}
