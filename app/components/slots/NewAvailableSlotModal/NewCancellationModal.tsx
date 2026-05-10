// app/components/slots/NewAvailableSlotModal/NewCancellationModal.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import StandardModal from "@/app/components/crussader/StandardModal";
import { Button } from "@/app/components/ui/button";
import type { SelectedServiceItem } from "@/app/components/slots/modal/slotModal.types";
import type { CancelledAppointmentItem } from "@/app/components/slots/CancelledAppointments/CancelledAppointmentsList";
import { NewCancellationModalForm } from "./NewCancellationModalForm";
import {
  buildIsoFromLocal,
  canSubmitSlotCreation,
  getSlotDurationMinutes,
  getTodayDateValue,
  validateSlotCreation,
  type EmployeeLite,
} from "./NewCancellationModal.helpers";

type EmployeeServiceItem = {
  id: string;
  name: string;
  durationMin: number;
  price: number;
  active: boolean;
};

type EmployeeServiceByEmployeeItem = EmployeeServiceItem & {
  employeeId: string;
};

type NewCancellationModalProps = {
  open: boolean;
  onClose: () => void;
  locationId: string;
  onCreated?: () => void;
  prefillAppointment?: CancelledAppointmentItem | null;
};

export function NewCancellationModal({
  open,
  onClose,
  locationId,
  onCreated,
  prefillAppointment = null,
}: NewCancellationModalProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeLite | null>(null);

  const [dateValue, setDateValue] = useState("");
  const [startTimeValue, setStartTimeValue] = useState("");
  const [endTimeValue, setEndTimeValue] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedServices, setSelectedServices] = useState<SelectedServiceItem[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [created, setCreated] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [employees, setEmployees] = useState<EmployeeLite[]>([]);
  const [servicesByEmployee, setServicesByEmployee] = useState<
    Record<string, EmployeeServiceItem[]>
  >({});
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

if (prefillAppointment) {
  setDateValue(getDateValueFromISO(prefillAppointment.startAt));
  setStartTimeValue(getTimeValueFromISO(prefillAppointment.startAt));
  setEndTimeValue(getTimeValueFromISO(prefillAppointment.endAt));
  setNotes("");
  setSelectedEmployeeId(prefillAppointment.employeeId ?? "");
} else {
      setDateValue(getTodayDateValue());
      setStartTimeValue("17:00");
      setEndTimeValue("17:30");
      setNotes("");
    }

    setSelectedServices([]);
    setSelectedServiceIds([]);
    setSelectedEmployeeId("");
    setSelectedEmployee(null);
    setIsSubmitting(false);
    setCreated(false);
    setErrorText("");
  }, [open, locationId, prefillAppointment]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!locationId) {
      setEmployees([]);
      setSelectedEmployeeId("");
      setSelectedEmployee(null);
      return;
    }

    let cancelled = false;

    async function loadEmployees() {
      setIsLoadingEmployees(true);

      try {
        const response = await fetch(
          `/api/slots/employees/list?locationId=${encodeURIComponent(locationId)}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (cancelled) {
          return;
        }

const nextEmployees: EmployeeLite[] = Array.isArray(data?.employees)
  ? data.employees.map((item: any) => {
      const name =
        item.name ??
        item.fullName ??
        item.displayName ??
        item.firstName ??
        "Empleado";

      return {
        id: String(item.id),
        name: String(name),
        color: item.color ?? "#94A3B8",
        active: true,
      };
    })
  : [];

        setEmployees(nextEmployees);

        if (prefillAppointment?.employeeId) {
  const foundEmployee = nextEmployees.find((employee) => {
    return employee.id === prefillAppointment.employeeId;
  });

  if (foundEmployee) {
    setSelectedEmployeeId(foundEmployee.id);
    setSelectedEmployee(foundEmployee);
  }
}

        const stillExists = nextEmployees.some((employee) => {
          return employee.id === selectedEmployeeId;
        });

        if (!stillExists) {
          setSelectedEmployeeId("");
          setSelectedEmployee(null);
          setSelectedServices([]);
          setSelectedServiceIds([]);
        }
      } catch (error) {
        console.error("[NewCancellationModal] loadEmployees", error);

        if (!cancelled) {
          setEmployees([]);
          setSelectedEmployeeId("");
          setSelectedEmployee(null);
          setSelectedServices([]);
          setSelectedServiceIds([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingEmployees(false);
        }
      }
    }

    loadEmployees();

    return () => {
      cancelled = true;
    };
  }, [open, locationId, prefillAppointment]);

  useEffect(() => {
    if (!open || !locationId) {
      setServicesByEmployee({});
      return;
    }

    let cancelled = false;

    async function loadAllServices() {
      try {
        const response = await fetch(
          `/api/slots/employees/services/list?locationId=${encodeURIComponent(locationId)}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (cancelled) {
          return;
        }

        const rows: EmployeeServiceByEmployeeItem[] = Array.isArray(data?.services)
          ? data.services
          : [];

        const grouped: Record<string, EmployeeServiceItem[]> = {};

        rows.forEach((service) => {
          if (!grouped[service.employeeId]) {
            grouped[service.employeeId] = [];
          }

          grouped[service.employeeId].push({
            id: service.id,
            name: service.name,
            durationMin: service.durationMin,
            price: service.price,
            active: service.active,
          });
        });

        setServicesByEmployee(grouped);
      } catch (error) {
        console.error("[NewCancellationModal] loadAllServices", error);

        if (!cancelled) {
          setServicesByEmployee({});
        }
      }
    }

    loadAllServices();

    return () => {
      cancelled = true;
    };
  }, [open, locationId]);

  const slotDurationMin = useMemo(() => {
    return getSlotDurationMinutes(dateValue, startTimeValue, endTimeValue);
  }, [dateValue, startTimeValue, endTimeValue]);

  const canSubmit = useMemo(() => {
    return canSubmitSlotCreation({
      locationId,
      selectedEmployeeId,
      dateValue,
      startTimeValue,
      endTimeValue,
      slotDurationMin,
      isSubmitting,
    });
  }, [
    locationId,
    selectedEmployeeId,
    dateValue,
    startTimeValue,
    endTimeValue,
    slotDurationMin,
    isSubmitting,
  ]);

  const handleServicesChange = useCallback(
    (services: EmployeeServiceItem[], selectedIds: string[]) => {
      const nextSelectedServices: SelectedServiceItem[] = services
        .filter((service) => selectedIds.includes(service.id))
        .map((service) => ({
          serviceId: service.id,
          serviceName: service.name,
          durationMin: service.durationMin,
          price: service.price,
        }));

      setSelectedServices(nextSelectedServices);
      setSelectedServiceIds(selectedIds);
    },
    []
  );

  async function handleCreate() {
    setErrorText("");

    const validationError = validateSlotCreation({
      locationId,
      selectedEmployeeId,
      dateValue,
      startTimeValue,
      endTimeValue,
    });

    if (validationError) {
      setErrorText(validationError);
      return;
    }

    const startsAt = buildIsoFromLocal(dateValue, startTimeValue);
    const endsAt = buildIsoFromLocal(dateValue, endTimeValue);

    if (!startsAt || !endsAt) {
      setErrorText("Fecha u hora no válidas.");
      return;
    }

    setIsSubmitting(true);

    try {
      const slotResponse = await fetch("/api/slots/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selectedLocationId: locationId,
          employeeId: selectedEmployeeId,
          startsAt,
          endsAt,
          serviceName: null,
          notes: notes.trim() || undefined,
          selectedServiceIds,
          sourceAppointmentId: prefillAppointment?.id ?? null,
        }),
      });

      const slotData = await slotResponse.json();

      if (!slotResponse.ok || !slotData?.ok || !slotData?.slot?.id) {
        setErrorText("No se pudo crear el hueco.");
        setIsSubmitting(false);
        return;
      }

      setCreated(true);
      onCreated?.();
      setIsSubmitting(false);

      window.setTimeout(() => {
        onClose();
      }, 1200);
    } catch (error) {
      console.error("[NewCancellationModal]", error);
      setErrorText("Error de red al crear el hueco.");
      setIsSubmitting(false);
    }
  }

return (
  <StandardModal
    open={open}
    title="Crear hueco disponible"
    onClose={onClose}
    footer={
      <div className="flex w-full items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
          className="h-10 rounded-xl"
        >
          Cancelar
        </Button>

        <Button
          type="button"
          onClick={handleCreate}
          disabled={!canSubmit || created}
          className="h-10 gap-2 rounded-xl bg-crussader px-5 font-semibold text-white hover:bg-crussader/90"
        >
          <>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creando
              </>
            ) : created ? (
              "Hueco creado"
            ) : (
              "Crear hueco"
            )}
          </>
        </Button>
      </div>
    }
  >
    <div className="max-h-[72dvh] overflow-y-auto pr-1">
      <NewCancellationModalForm
        employees={employees}
        servicesByEmployee={servicesByEmployee}
        selectedEmployeeId={selectedEmployeeId}
        onEmployeeSelect={(employee) => {
          setSelectedEmployeeId(employee.id);
          setSelectedEmployee(employee);
        }}
        selectedEmployee={selectedEmployee}
        dateValue={dateValue}
        startTimeValue={startTimeValue}
        endTimeValue={endTimeValue}
        notes={notes}
        onDateChange={setDateValue}
        onStartTimeChange={setStartTimeValue}
        onEndTimeChange={setEndTimeValue}
        onNotesChange={setNotes}
        errorText={errorText}
        created={created}
        selectedServiceIds={selectedServiceIds}
        onServicesChange={handleServicesChange}
      />
    </div>
  </StandardModal>
);
}

function getDateValueFromISO(value: string): string {
  const date = new Date(value);
  return date.toLocaleDateString("en-CA");
}

function getTimeValueFromISO(value: string): string {
  const date = new Date(value);

  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}