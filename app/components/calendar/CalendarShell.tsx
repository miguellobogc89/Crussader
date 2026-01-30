// app/components/calendar/CalendarShell.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useBootstrapData } from "@/app/providers/bootstrap-store";

import LocationSelector, {
  type LocationLite,
} from "@/app/components/crussader/LocationSelector";

import ResourceView from "@/app/components/calendar/resources/ResourceView";
import CalendarView from "@/app/components/calendar/CalendarOnly/CalendarView";

import type { HolidayLite } from "@/app/components/calendar/CalendarOnly/types";
import type { ShiftTypeValue } from "@/app/components/calendar/resources/shift/ShiftList";
import type { Employee } from "@/app/components/calendar/resources/employees/EmployeeList";
import type { StaffRoleLite } from "@/app/components/calendar/resources/employees/types";
import type { ShiftTemplateLite } from "@/app/components/calendar/resources/shift/ShiftList";

import { localKeyTZ } from "@/app/components/calendar/CalendarOnly/tz";

type RangeISO = { fromISO: string; toISO: string };

type Props = {
  workspaceHeight?: string;
  showRightPanel?: boolean;
};

type PaintedAssignment = {
  employeeIds: string[];
  shiftLabel: string;
};

type ResourceSnapshot = {
  employees: Employee[];
  roles: StaffRoleLite[];
  shiftTemplates: ShiftTemplateLite[];
};

type ShiftEventLite = {
  id: string;
  employeeId: string | null;
  locationId: string | null;
  startAt: string;
  endAt: string;
  kind: string; // viene de BBDD (shift_event_kind)
  label: string | null;
  templateId: string | null;
};

const START_HOUR = 8;
const HOURS_COUNT = 12;

function kindLabel(kind: string) {
  if (kind === "WORK") return "Trabajo";
  if (kind === "VACATION") return "Vacaciones";
  if (kind === "SICK") return "Baja";
  if (kind === "OFF") return "Libre"; // ✅ tu enum real
  return "Turno";
}

export default function CalendarShell({
  workspaceHeight = "78vh",
  showRightPanel = false,
}: Props) {
  const boot = useBootstrapData();
  const companyId = boot?.activeCompany?.id ?? null;

  const [locationId, setLocationId] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationLite | null>(null);

  // ===== resource data (FUENTE DE VERDAD) =====
  const [resources, setResources] = useState<ResourceSnapshot>({
    employees: [],
    roles: [],
    shiftTemplates: [],
  });

  // ===== selections =====
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [shiftType, setShiftType] = useState<ShiftTypeValue>({
    type: "kind",
    kind: "WORK",
  });

  // ===== painted assignments (in-memory o hidratado desde BBDD) =====
  const [painted, setPainted] = useState<Map<string, PaintedAssignment>>(
    () => new Map()
  );

  const paintedCellIds = useMemo(() => new Set(painted.keys()), [painted]);

  function employeeNameById(id: string) {
    const e = resources.employees.find((x) => x.id === id);
    return e ? e.name : id;
  }

  function resolveShiftLabelFromSelection(): string {
    if (shiftType.type === "kind") return kindLabel(shiftType.kind);

    const t = resources.shiftTemplates.find((x) => x.id === shiftType.templateId);
    return t ? t.name : "Turno";
  }

  function upsertPaint(cellId: string) {
    if (!locationId) return;
    if (selectedEmployeeIds.length === 0) return;

    const label = resolveShiftLabelFromSelection();

    setPainted((prev) => {
      const next = new Map(prev);
      next.set(cellId, {
        employeeIds: [...selectedEmployeeIds],
        shiftLabel: label,
      });
      return next;
    });
  }

  // ===== holidays (global) =====
  const [holidays, setHolidays] = useState<HolidayLite[]>([]);
  const [range, setRange] = useState<RangeISO | null>(null);

  const lastHolidayFetchKeyRef = useRef<string>("");
  useEffect(() => {
    if (!locationId || !range) {
      setHolidays([]);
      lastHolidayFetchKeyRef.current = "";
      return;
    }

    const key = `${locationId}|${range.fromISO}|${range.toISO}`;
    if (key === lastHolidayFetchKeyRef.current) return;
    lastHolidayFetchKeyRef.current = key;

    const ac = new AbortController();

    (async () => {
      try {
        const qs = new URLSearchParams({
          locationId,
          from: range.fromISO,
          to: range.toISO,
        });

        const res = await fetch(`/api/calendar/holidays?${qs.toString()}`, {
          cache: "no-store",
          signal: ac.signal,
        });

        const data = await res.json().catch(() => null);

        if (!res.ok || !data || data?.ok === false) {
          setHolidays([]);
          return;
        }

        setHolidays(Array.isArray(data.items) ? data.items : []);
      } catch {
        if (!ac.signal.aborted) setHolidays([]);
      }
    })();

    return () => ac.abort();
  }, [locationId, range]);

  // ===== shift-events (persistidos) -> painted =====
  const lastShiftFetchKeyRef = useRef<string>("");

  useEffect(() => {
    if (!companyId || !locationId || !range) return;

    const key = `${companyId}|${locationId}|${range.fromISO}|${range.toISO}`;
    if (key === lastShiftFetchKeyRef.current) return;
    lastShiftFetchKeyRef.current = key;

    const ac = new AbortController();

    (async () => {
      try {
        const qs = new URLSearchParams({
          companyId,
          locationId,
          from: range.fromISO,
          to: range.toISO,
        });

        const res = await fetch(`/api/calendar/shift-events?${qs.toString()}`, {
          cache: "no-store",
          signal: ac.signal,
        });

        const data = await res.json().catch(() => null);

        if (!res.ok || !data || data?.ok === false) return;

        const items: ShiftEventLite[] = Array.isArray(data.items) ? data.items : [];

        const next = new Map<string, PaintedAssignment>();

        for (const ev of items) {
          const start = new Date(ev.startAt);
          const end = new Date(ev.endAt);

          // label preferente: templateName > label > kind
          let label = "";
          if (ev.templateId) {
            const t = resources.shiftTemplates.find((x) => x.id === ev.templateId);
            if (t) label = t.name;
          }
          if (!label && ev.label) label = ev.label;
          if (!label) label = kindLabel(ev.kind);

          const empIds: string[] = [];
          if (ev.employeeId) empIds.push(ev.employeeId);

          // Month: day cells
          const cursorDay = new Date(start);
          cursorDay.setHours(0, 0, 0, 0);

          const endDay = new Date(end);
          endDay.setHours(0, 0, 0, 0);

          while (+cursorDay <= +endDay) {
            const dayKey = localKeyTZ(cursorDay);
            next.set(`${dayKey}|day`, { employeeIds: empIds, shiftLabel: label });
            cursorDay.setDate(cursorDay.getDate() + 1);
          }

          // Week/Day: hour cells dentro de [START_HOUR, START_HOUR+HOURS_COUNT)
          const cursor = new Date(start);
          cursor.setMinutes(0, 0, 0);

          const last = new Date(end);

          while (+cursor < +last) {
            const dayKey = localKeyTZ(cursor);
            const hourIndex = cursor.getHours() - START_HOUR;

            if (hourIndex >= 0 && hourIndex < HOURS_COUNT) {
              next.set(`${dayKey}|${hourIndex}`, { employeeIds: empIds, shiftLabel: label });
            }

            cursor.setHours(cursor.getHours() + 1);
          }
        }

        if (!ac.signal.aborted) setPainted(next);
      } catch {
        // silence
      }
    })();

    return () => ac.abort();
  }, [
    companyId,
    locationId,
    range?.fromISO,
    range?.toISO,
    resources.shiftTemplates,
  ]);

  return (
    <>
      <LocationSelector
        onSelect={(id, loc) => {
          setLocationId(id);
          setLocation(loc ?? null);

          setPainted(new Map());
          setSelectedEmployeeIds([]);
          setShiftType({ type: "kind", kind: "WORK" });

          setResources({ employees: [], roles: [], shiftTemplates: [] });
          setHolidays([]);
          setRange(null);

          lastHolidayFetchKeyRef.current = "";
          lastShiftFetchKeyRef.current = "";
        }}
      />

      <div className="min-h-0 overflow-hidden" style={{ height: workspaceHeight }}>
        <div className="flex h-full gap-4 overflow-hidden">
          <div className="shrink-0 h-full">
            <ResourceView
              locationId={locationId}
              selectedEmployeeIds={selectedEmployeeIds}
              onChangeSelectedEmployeeIds={setSelectedEmployeeIds}
              shiftType={shiftType}
              onChangeShiftType={setShiftType}
              onDataSnapshot={setResources}
            />
          </div>

          <div className="flex-1 min-w-0 h-full overflow-hidden flex flex-col">
            <CalendarView
              locationId={locationId}
              holidays={holidays}
              paintedCellIds={paintedCellIds}
              onPaintCell={upsertPaint}
              painted={painted}
              employeeNameById={employeeNameById}
              onRangeChange={(next) =>
                setRange((prev) => {
                  if (!prev) return next;
                  if (prev.fromISO === next.fromISO && prev.toISO === next.toISO) return prev;
                  return next;
                })
              }
            />
          </div>

          {showRightPanel ? <div className="shrink-0 h-full" /> : null}
        </div>
      </div>

      <div className="hidden">
        {locationId}
        {location?.id}
      </div>
    </>
  );
}
