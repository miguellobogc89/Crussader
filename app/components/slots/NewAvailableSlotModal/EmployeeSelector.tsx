// app/components/slots/NewAvailableSlotModal/EmployeeSelector.tsx
"use client";

import { Check } from "lucide-react";
import type { EmployeeLite } from "./NewCancellationModal.helpers";
import { cn } from "@/lib/utils";

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
  if (employees.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-white px-3 py-4 text-sm text-muted-foreground">
        No hay empleados disponibles
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {employees.map((employee) => {
        const isSelected = employee.id === selectedEmployeeId;

        return (
          <button
            key={employee.id}
            type="button"
            onClick={() => onSelect(employee)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
              isSelected
                ? "border-[#0B6CF4] bg-[#0B6CF4] text-white shadow-[0_2px_8px_rgba(11,108,244,0.25)]"
                : "border-border bg-white text-slate-700 hover:bg-muted/40"
            )}
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: employee.color || "#94A3B8" }}
            />

            <span>{employee.name}</span>

            {isSelected ? <Check className="h-3.5 w-3.5" /> : null}
          </button>
        );
      })}
    </div>
  );
}