// app/components/calendar/CalendarShell.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import ResourceView from "@/app/components/calendar/resources/ResourceView";
import CalendarView from "@/app/components/calendar/calendar/CalendarView";
import DetailsView from "@/app/components/calendar/details/DetailsView";

import {
  useActiveLocationId,
  useBootstrapData,
} from "@/app/providers/bootstrap-store";

import type {
  ShiftTypeValue,
  ShiftTemplateLite,
} from "@/app/components/calendar/details/shifts/ShiftList";
import type { Employee } from "@/app/components/calendar/resources/employees/EmployeeList";

function dayKeyFromCellId(cellId: string | null) {
  if (!cellId) return "";
  const ix = cellId.indexOf("|");
  if (ix === -1) return cellId;
  return cellId.slice(0, ix);
}

function todayDayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function CalendarShell() {
  const activeLocationId = useActiveLocationId();
  const bootstrapData = useBootstrapData();
const companyId = bootstrapData?.activeCompanyResolved?.id ?? null;
  const [locationId, setLocationId] = useState<string | null>(activeLocationId);

  useEffect(() => {
    if (!activeLocationId) return;
    setLocationId(activeLocationId);
  }, [activeLocationId]);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [templates, setTemplates] = useState<ShiftTemplateLite[]>([]);

  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [shiftType, setShiftType] = useState<ShiftTypeValue>({
    templateId: "standard",
  });

  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);

  const employeeNameById = useCallback(
    (id: string) => {
      const found = employees.find((e) => String(e.id) === String(id));
      if (found) return found.name;
      return id;
    },
    [employees]
  );

  void templates;
  void DetailsView;

  const selectedDayKey = useMemo(() => {
    const k = dayKeyFromCellId(selectedCellId);
    if (k) return k;
    return todayDayKey();
  }, [selectedCellId]);

  const painted = useMemo(() => new Map(), []);

  void selectedDayKey;
  void painted;

  return (
    <>

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
          companyId={companyId}
          locationId={locationId}
          employeeNameById={employeeNameById}
          onCellClick={(cellId: string) => setSelectedCellId(cellId)}
          selectedCellId={selectedCellId}
        />
      </div>
    </>
  );
}