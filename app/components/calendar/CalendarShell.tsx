// app/components/calendar/CalendarShell.tsx
"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import LocationSelector from "@/app/components/crussader/LocationSelector";

import ResourceView from "@/app/components/calendar/resources/ResourceView";
import CalendarView from "@/app/components/calendar/calendar/CalendarView";

import {
  applyPaintWeekLike,
  type PaintBlock,
} from "@/app/components/calendar/calendar/shiftPaintEngine";

import type {
  ShiftTypeValue,
  ShiftTemplateLite,
} from "@/app/components/calendar/details/shifts/ShiftList";

import type { Employee } from "@/app/components/calendar/resources/employees/EmployeeList";
import type { HolidayLite } from "@/app/components/calendar/calendar/types";
import type { Range } from "@/app/components/calendar/calendar/CalendarView";

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

  const resolveShiftLabel = useCallback(() => {
    const id = String(shiftType.templateId);

    if (id === "standard") return "Turno estándar";
    if (id === "abs_vacation") return "Vacaciones";
    if (id === "abs_sick") return "Baja";
    if (id === "abs_off") return "Permiso";

    const t = templates.find((x) => String(x.id) === id);
    if (t) return t.name;

    return "Turno";
  }, [shiftType, templates]);

  // ✅ motor encapsulado (Shell solo lo instancia y pasa handlers/estado)
  const paint = useShiftPaintSession({
    locationId,
    selectedEmployeeIds,
    shiftType,
    templates,
    START_HOUR,
    HOURS_COUNT,
    resolveLabel: resolveShiftLabel,
  });

  // (Opcional) tu mapa “painted” para overlays por celda (si lo usas en Week/Day)
  const painted = useMemo(() => {
    const m = new Map<string, PaintedAssignment>();

    for (const b of paint.blocks) {
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
  }, [paint.blocks]);

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
          employeeNameById={employeeNameById}
          employeeColorById={employeeColorById}
          blocks={paint.blocks}
          onPaintCell={paint.paintCell}
          painted={painted}
          onRangeChange={(next) => {
            setRange((prev) => {
              if (!prev) return next;
              if (prev.fromISO === next.fromISO && prev.toISO === next.toISO) {
                return prev;
              }
              return next;
            });
          }}
        />
      </div>
    </>
  );
}

/**
 * Hook local (mismo archivo) para NO crear ficheros nuevos.
 * Aquí vive toda la regla de pintado (no en el Shell).
 */
function useShiftPaintSession(args: {
  locationId: string | null;
  selectedEmployeeIds: string[];
  shiftType: ShiftTypeValue;
  templates: ShiftTemplateLite[];
  START_HOUR: number;
  HOURS_COUNT: number;
  resolveLabel: () => string;
}) {
  const {
    locationId,
    selectedEmployeeIds,
    shiftType,
    templates,
    START_HOUR,
    HOURS_COUNT,
    resolveLabel,
  } = args;

  const [blocks, setBlocks] = useState<PaintBlock[]>([]);

  // refs para evitar closures raros en drag-paint
  const locRef = useRef<string | null>(locationId);
  const selRef = useRef<string[]>(selectedEmployeeIds);
  const shiftRef = useRef<ShiftTypeValue>(shiftType);
  const tplRef = useRef<ShiftTemplateLite[]>(templates);
  const labelRef = useRef<() => string>(resolveLabel);

  locRef.current = locationId;
  selRef.current = selectedEmployeeIds;
  shiftRef.current = shiftType;
  tplRef.current = templates;
  labelRef.current = resolveLabel;

  const paintCell = useCallback((cellId: string) => {
    const loc = locRef.current;
    const sel = selRef.current;

    if (!loc) return;
    if (!sel || sel.length === 0) return;

    setBlocks((prev) => {
      return applyPaintWeekLike({
        prevBlocks: prev,
        cellId,
        selectedEmployeeIds: sel,
        shiftType: shiftRef.current,
        templates: tplRef.current,
        START_HOUR,
        HOURS_COUNT,
        resolveLabel: labelRef.current,
      });
    });
  }, [START_HOUR, HOURS_COUNT]);

  return { blocks, paintCell };
}
