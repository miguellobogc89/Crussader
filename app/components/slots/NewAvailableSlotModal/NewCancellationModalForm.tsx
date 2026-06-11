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
  onDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  errorText: string;
  created: boolean;
  employees: EmployeeLite[];
  isLoadingEmployees: boolean;
  servicesByEmployee: Record<string, EmployeeServiceItem[]>;
  slotDurationMin: number;
  invalidServices: EmployeeServiceItem[];
  selectedEmployeeId: string;
  isSinglePractitioner: boolean;
  onEmployeeSelect: (employee: EmployeeLite) => void;
  selectedServiceIds: string[];
  onServicesChange: (
    services: EmployeeServiceItem[],
    selectedIds: string[]
  ) => void;
};

export function NewCancellationModalForm({
  dateValue,
  startTimeValue,
  endTimeValue,
  onDateChange,
  onStartTimeChange,
  onEndTimeChange,
  errorText,
  created,
  employees,
  isLoadingEmployees,
  servicesByEmployee,
  slotDurationMin,
  invalidServices,
  selectedEmployeeId,
  isSinglePractitioner,
  onEmployeeSelect,
  selectedServiceIds,
  onServicesChange,
}: NewCancellationModalFormProps) {
  return (
    <div className="space-y-4 px-4 pb-4 pt-0">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Fecha</Label>
          <Input
            type="date"
            value={dateValue}
            onChange={(event) => onDateChange(event.target.value)}
            className="h-10 rounded-xl border-0 bg-muted/50 focus-visible:ring-primary"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Inicio</Label>
          <Input
            type="time"
            step={300}
            value={startTimeValue}
            onChange={(event) => onStartTimeChange(event.target.value)}
            className="h-10 rounded-xl border-0 bg-muted/50 tabular-nums focus-visible:ring-primary"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Fin</Label>
          <Input
            type="time"
            step={300}
            value={endTimeValue}
            onChange={(event) => onEndTimeChange(event.target.value)}
            className="h-10 rounded-xl border-0 bg-muted/50 tabular-nums focus-visible:ring-primary"
          />
        </div>
      </div>

      <div className="space-y-2">
{!isSinglePractitioner ? (
  <>
    <Label className="text-sm text-muted-foreground">Empleado</Label>

{isLoadingEmployees ? null : (
  <EmployeeSelector
    employees={employees}
    selectedEmployeeId={selectedEmployeeId}
    onSelect={onEmployeeSelect}
  />
)}
  </>
) : null}

        <NewCancellationEmployeeServices
          employeeId={selectedEmployeeId}
          services={servicesByEmployee[selectedEmployeeId] ?? []}
          selectedServiceIds={selectedServiceIds}
          invalidServiceIds={invalidServices.map((service) => {
            return service.id;
          })}
          onChange={onServicesChange}
        />
      </div>

      {invalidServices.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          El hueco dura {slotDurationMin} min. Hay servicios seleccionados que no caben en esa duración.
        </div>
      ) : null}

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