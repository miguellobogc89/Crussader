// app/components/slots/NewAvailableSlotModal/NewCancellationModalForm.tsx
"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import type { EmployeeLite } from "./NewCancellationModal.helpers";
import { EmployeeSelector } from "./EmployeeSelector";
import { NewCancellationEmployeeServices } from "./NewCancellationEmployeeServices";

type EmployeeServiceItem = {
  id: string;
  name: string;
  durationMin: number;
  price: number;
  active: boolean;
};

type NewCancellationModalFormProps = {
  selectedEmployee: EmployeeLite | null;
  dateValue: string;
  startTimeValue: string;
  endTimeValue: string;
  notes: string;
  onDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  errorText: string;
  created: boolean;
  employees: EmployeeLite[];
  selectedEmployeeId: string;
  onEmployeeSelect: (employee: EmployeeLite) => void;
  selectedServiceIds: string[];
  onServicesChange: (
    services: EmployeeServiceItem[],
    selectedIds: string[]
  ) => void;
};

export function NewCancellationModalForm({
  selectedEmployee,
  dateValue,
  startTimeValue,
  endTimeValue,
  notes,
  onDateChange,
  onStartTimeChange,
  onEndTimeChange,
  onNotesChange,
  errorText,
  created,
  employees,
  selectedEmployeeId,
  onEmployeeSelect,
  selectedServiceIds,
  onServicesChange,
}: NewCancellationModalFormProps) {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Empleado</Label>

        <EmployeeSelector
          employees={employees}
          selectedEmployeeId={selectedEmployeeId}
          onSelect={onEmployeeSelect}
        />

        <NewCancellationEmployeeServices
          employeeId={selectedEmployeeId}
          selectedServiceIds={selectedServiceIds}
          onChange={onServicesChange}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="space-y-2 sm:col-span-4">
          <Label className="text-sm text-muted-foreground">Fecha</Label>
          <Input
            type="date"
            value={dateValue}
            onChange={(event) => onDateChange(event.target.value)}
            className="h-10 rounded-xl border-0 bg-muted/50 focus-visible:ring-primary"
          />
        </div>

        <div className="space-y-2 sm:col-span-1">
          <Label className="text-sm text-muted-foreground">Hora inicio</Label>
          <Input
            type="time"
            step={300}
            value={startTimeValue}
            onChange={(event) => onStartTimeChange(event.target.value)}
            className="h-10 rounded-xl border-0 bg-muted/50 tabular-nums focus-visible:ring-primary"
          />
        </div>

        <div className="space-y-2 sm:col-span-1">
          <Label className="text-sm text-muted-foreground">Hora fin</Label>
          <Input
            type="time"
            step={300}
            value={endTimeValue}
            onChange={(event) => onEndTimeChange(event.target.value)}
            className="h-10 rounded-xl border-0 bg-muted/50 tabular-nums focus-visible:ring-primary"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label className="text-sm text-muted-foreground">Nota</Label>
          <Input
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            placeholder="Opcional"
            className="h-10 rounded-xl border-0 bg-muted/50 focus-visible:ring-primary"
          />
        </div>
      </div>

      {errorText ? (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorText}</span>
        </div>
      ) : null}

      {created ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Hueco creado correctamente.</span>
        </div>
      ) : null}
    </div>
  );
}