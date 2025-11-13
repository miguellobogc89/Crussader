"use client";

import * as React from "react";
import PageShell from "@/app/components/layouts/PageShell";
import { ShiftEmployeesPanel } from "@/app/components/shifts/ShiftEmployeesPanel";
// AHORA importamos desde el archivo principal que creamos
import { EmployeeShiftsCalendar } from "@/app/components/shifts/calendar/ShiftsCalendar";

export default function ShiftsPage() {
  // Ahora solo un empleado seleccionado a la vez
  const [selectedEmployeeId, setSelectedEmployeeId] = React.useState<string | null>(null);

  return (
    <PageShell
      title="Turnos"
      description="Organiza horarios, vacaciones y ausencias de tu equipo."
    >
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(260px,320px),1fr]">
        {/* Panel lateral de empleados (selección única) */}
        <div className="min-h-[260px]">
          <ShiftEmployeesPanel
            selectedEmployeeId={selectedEmployeeId}
            onSelect={(id: string | null) => setSelectedEmployeeId(id)}
          />
        </div>

        {/* Calendario de turnos SIEMPRE visible */}
        <div className="min-h-[360px]">
          <EmployeeShiftsCalendar selectedEmployeeId={selectedEmployeeId} />
        </div>
      </div>
    </PageShell>
  );
}
