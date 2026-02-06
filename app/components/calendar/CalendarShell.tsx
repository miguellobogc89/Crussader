"use client";

import { useCallback, useState } from "react";
import LocationSelector from "@/app/components/crussader/LocationSelector";

import ResourceView from "@/app/components/calendar/resources/ResourceView";
import CalendarView from "@/app/components/calendar/calendar/CalendarView";

import type {
  ShiftTypeValue,
  ShiftTemplateLite,
} from "@/app/components/calendar/details/shifts/ShiftList";
import type { Employee } from "@/app/components/calendar/resources/employees/EmployeeList";

export default function CalendarShell() {
  const [locationId, setLocationId] = useState<string | null>(null);

  // data snapshots (para employeeNameById / labels futuras)
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [templates, setTemplates] = useState<ShiftTemplateLite[]>([]);

  // selección del panel resources
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [shiftType, setShiftType] = useState<ShiftTypeValue>({
    templateId: "standard",
  });

  // click de calendario (sin pintar)
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
          employeeNameById={employeeNameById}
          onCellClick={(cellId: string) => setSelectedCellId(cellId)}
          selectedCellId={selectedCellId}
        />
      </div>
    </>
  );
}
