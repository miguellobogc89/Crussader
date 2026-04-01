// app/components/slots/NewAvailableSlotModal/NewCancellationModal.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import StandardCard from "@/app/components/crussader/UX/standardCard";
import type { SelectedServiceItem } from "@/app/components/slots/modal/slotModal.types";
import { NewCancellationModalHeader } from "./NewCancellationModalHeader";
import { NewCancellationModalForm } from "./NewCancellationModalForm";
import { NewCancellationModalFooter } from "./NewCancellationModalFooter";
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

type NewCancellationModalProps = {
  open: boolean;
  onClose: () => void;
  locationId: string;
};

export function NewCancellationModal({
  open,
  onClose,
  locationId,
}: NewCancellationModalProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeLite | null>(
    null
  );

  const [dateValue, setDateValue] = useState("");
  const [startTimeValue, setStartTimeValue] = useState("");
  const [endTimeValue, setEndTimeValue] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedServices, setSelectedServices] = useState<
    SelectedServiceItem[]
  >([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [created, setCreated] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [employees, setEmployees] = useState<EmployeeLite[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  useEffect(() => {
    console.log("[NewCancellationModal] open =", open);
    console.log("[NewCancellationModal] locationId =", locationId);

    if (!open) {
      return;
    }

    setDateValue(getTodayDateValue());
    setStartTimeValue("17:00");
    setEndTimeValue("17:30");
    setNotes("");
    setSelectedServices([]);
    setSelectedServiceIds([]);
    setSelectedEmployeeId("");
    setSelectedEmployee(null);
    setIsSubmitting(false);
    setCreated(false);
    setErrorText("");
  }, [open, locationId]);

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
              return {
                id: String(item.id),
                name: String(item.name),
                active: true,
              };
            })
          : [];

        setEmployees(nextEmployees);

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
  }, [open, locationId, selectedEmployeeId]);

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
      .filter((service) => {
        return selectedIds.includes(service.id);
      })
      .map((service) => {
        return {
          serviceId: service.id,
          serviceName: service.name,
          durationMin: service.durationMin,
          price: service.price,
        };
      });

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
        }),
      });

      const slotData = await slotResponse.json();

      if (!slotResponse.ok || !slotData?.ok || !slotData?.slot?.id) {
        setErrorText("No se pudo crear el hueco.");
        setIsSubmitting(false);
        return;
      }

      setCreated(true);
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
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-foreground/10 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <StandardCard className="w-full max-w-3xl bg-white">
              <div onClick={(event) => event.stopPropagation()}>
                <NewCancellationModalHeader onClose={onClose} />

                <NewCancellationModalForm
                  employees={employees}
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

                <NewCancellationModalFooter
                  isSubmitting={isSubmitting}
                  created={created}
                  disabled={!canSubmit || created}
                  onSubmit={handleCreate}
                />
              </div>
            </StandardCard>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}