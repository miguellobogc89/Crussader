// app/components/slots/helpers/SlotsNewCancellationModal.helpers.ts
import type { SelectedServiceItem } from "@/app/components/slots/modal/slotModal.types";

export type EmployeeLite = {
  id: string;
  name: string;
  active: boolean;
};

export function getTodayDateValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function buildIsoFromLocal(
  dateValue: string,
  timeValue: string
): string | null {
  if (!dateValue) {
    return null;
  }

  if (!timeValue) {
    return null;
  }

  const value = new Date(`${dateValue}T${timeValue}:00`);

  if (Number.isNaN(value.getTime())) {
    return null;
  }

  return value.toISOString();
}

export function getSlotDurationMinutes(
  dateValue: string,
  startTimeValue: string,
  endTimeValue: string
): number {
  const startsAt = buildIsoFromLocal(dateValue, startTimeValue);
  const endsAt = buildIsoFromLocal(dateValue, endTimeValue);

  if (!startsAt) {
    return 0;
  }

  if (!endsAt) {
    return 0;
  }

  const diffMs = new Date(endsAt).getTime() - new Date(startsAt).getTime();

  if (diffMs <= 0) {
    return 0;
  }

  return Math.floor(diffMs / 60000);
}

export function canSubmitSlotCreation(params: {
  selectedLocationId: string;
  selectedEmployeeId: string;
  dateValue: string;
  startTimeValue: string;
  endTimeValue: string;
  slotDurationMin: number;
  selectedServices: SelectedServiceItem[];
  isSubmitting: boolean;
}): boolean {
  if (!params.selectedLocationId) {
    return false;
  }

  if (!params.selectedEmployeeId) {
    return false;
  }

  if (!params.dateValue) {
    return false;
  }

  if (!params.startTimeValue) {
    return false;
  }

  if (!params.endTimeValue) {
    return false;
  }

  if (params.slotDurationMin <= 0) {
    return false;
  }

  if (params.selectedServices.length === 0) {
    return false;
  }

  if (params.isSubmitting) {
    return false;
  }

  return true;
}

export function validateSlotCreation(params: {
  selectedLocationId: string;
  selectedEmployeeId: string;
  dateValue: string;
  startTimeValue: string;
  endTimeValue: string;
  selectedServices: SelectedServiceItem[];
}): string {
  if (!params.selectedLocationId) {
    return "Selecciona una ubicación.";
  }

  if (!params.selectedEmployeeId) {
    return "Selecciona un empleado.";
  }

  if (!params.dateValue) {
    return "Completa la fecha.";
  }

  if (!params.startTimeValue) {
    return "Completa la hora de inicio.";
  }

  if (!params.endTimeValue) {
    return "Completa la hora de fin.";
  }

  if (params.selectedServices.length === 0) {
    return "Selecciona al menos un servicio.";
  }

  const startsAt = buildIsoFromLocal(params.dateValue, params.startTimeValue);
  const endsAt = buildIsoFromLocal(params.dateValue, params.endTimeValue);

  if (!startsAt || !endsAt) {
    return "Fecha u hora no válidas.";
  }

  if (new Date(endsAt) <= new Date(startsAt)) {
    return "La hora fin debe ser posterior a la hora inicio.";
  }

  return "";
}