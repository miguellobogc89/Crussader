// app/components/slots/NewAvailableSlotModal/EmployeeSelector.tsx
"use client";

import { UserRound, Check } from "lucide-react";
import type { EmployeeLite } from "./NewCancellationModal.helpers";

type EmployeeSelectorProps = {
  employees: EmployeeLite[];
  selectedEmployeeId: string;
  onSelect: (employee: EmployeeLite) => void;
};

export function EmployeeSelector({
  employees,
  selectedEmployeeId,
  onSelect,
}: EmployeeSelectorProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-white">
      {employees.length === 0 ? (
        <div className="px-3 py-4 text-sm text-muted-foreground">
          No hay empleados disponibles
        </div>
      ) : null}

      {employees.map((employee) => {
        const isSelected = employee.id === selectedEmployeeId;

        return (
          <button
            key={employee.id}
            type="button"
            onClick={() => onSelect(employee)}
            className="flex w-full items-center justify-between px-3 py-3 text-left text-sm transition-colors hover:bg-muted/40"
          >
            <div className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{employee.name}</span>
            </div>

            {isSelected ? (
              <Check className="h-4 w-4 text-primary" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}