// app/components/slots/SlotsNewCancellationModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import StandardCard from "@/app/components/crussader/UX/standardCard";
import LocationSelector, {
  type LocationLite,
} from "@/app/components/crussader/LocationSelector";
import { SlotServiceSelector } from "@/app/components/slots/modal/SlotServiceSelector";
import type { SelectedServiceItem } from "@/app/components/slots/modal/slotModal.types";

type SlotsNewCancellationModalProps = {
  open: boolean;
  onClose: () => void;
};

function getTodayDateValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildIsoFromLocal(dateValue: string, timeValue: string): string | null {
  if (!dateValue || !timeValue) {
    return null;
  }

  const value = new Date(`${dateValue}T${timeValue}:00`);

  if (Number.isNaN(value.getTime())) {
    return null;
  }

  return value.toISOString();
}

function getSlotDurationMinutes(
  dateValue: string,
  startTimeValue: string,
  endTimeValue: string
): number {
  const startsAt = buildIsoFromLocal(dateValue, startTimeValue);
  const endsAt = buildIsoFromLocal(dateValue, endTimeValue);

  if (!startsAt || !endsAt) {
    return 0;
  }

  const diffMs = new Date(endsAt).getTime() - new Date(startsAt).getTime();

  if (diffMs <= 0) {
    return 0;
  }

  return Math.floor(diffMs / 60000);
}

export function SlotsNewCancellationModal({
  open,
  onClose,
}: SlotsNewCancellationModalProps) {
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<LocationLite | null>(null);

  const [dateValue, setDateValue] = useState("");
  const [startTimeValue, setStartTimeValue] = useState("");
  const [endTimeValue, setEndTimeValue] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedServices, setSelectedServices] = useState<SelectedServiceItem[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [created, setCreated] = useState(false);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setDateValue(getTodayDateValue());
    setStartTimeValue("17:00");
    setEndTimeValue("17:30");
    setNotes("");
    setSelectedServices([]);
    setIsSubmitting(false);
    setCreated(false);
    setErrorText("");
  }, [open]);

  const slotDurationMin = useMemo(() => {
    return getSlotDurationMinutes(dateValue, startTimeValue, endTimeValue);
  }, [dateValue, startTimeValue, endTimeValue]);

  const canSubmit = useMemo(() => {
    if (!selectedLocationId) {
      return false;
    }

    if (!dateValue || !startTimeValue || !endTimeValue) {
      return false;
    }

    if (slotDurationMin <= 0) {
      return false;
    }

    if (selectedServices.length === 0) {
      return false;
    }

    if (isSubmitting) {
      return false;
    }

    return true;
  }, [
    selectedLocationId,
    dateValue,
    startTimeValue,
    endTimeValue,
    slotDurationMin,
    selectedServices,
    isSubmitting,
  ]);

  async function handleCreate() {
    setErrorText("");

    if (!selectedLocationId) {
      setErrorText("Selecciona una ubicación.");
      return;
    }

    if (!dateValue || !startTimeValue || !endTimeValue) {
      setErrorText("Completa fecha, hora inicio y hora fin.");
      return;
    }

    if (selectedServices.length === 0) {
      setErrorText("Selecciona al menos un servicio.");
      return;
    }

    const startsAt = buildIsoFromLocal(dateValue, startTimeValue);
    const endsAt = buildIsoFromLocal(dateValue, endTimeValue);

    if (!startsAt || !endsAt) {
      setErrorText("Fecha u hora no válidas.");
      return;
    }

    if (new Date(endsAt) <= new Date(startsAt)) {
      setErrorText("La hora fin debe ser posterior a la hora inicio.");
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
          locationId: selectedLocationId,
          startsAt,
          endsAt,
          serviceName: selectedServices[0].serviceName,
          notes: notes.trim() || undefined,
        }),
      });


const slotData = await slotResponse.json();

if (!slotResponse.ok || !slotData?.ok || !slotData?.slot?.id) {
  setErrorText("No se pudo crear el hueco.");
  setIsSubmitting(false);
  return;
}
      

const assignResponse = await fetch("/api/slots/services/assign", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    slotId: slotData.slot.id,
    services: selectedServices.map((service, index) => {
      return {
        serviceId: service.serviceId,
        position: index,
      };
    }),
  }),
});

const assignData = await assignResponse.json();

if (!assignResponse.ok || !assignData?.ok) {
  setErrorText("El hueco se creó, pero no se pudieron asociar los servicios.");
  setIsSubmitting(false);
  return;
}

      if (!assignResponse.ok || !assignData?.ok) {
        setErrorText("El hueco se creó, pero no se pudieron asociar los servicios.");
        setIsSubmitting(false);
        return;
      }

      setCreated(true);
      setIsSubmitting(false);

      window.setTimeout(() => {
        onClose();
      }, 1200);
    } catch (error) {
      console.error("[SlotsNewCancellationModal]", error);
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
              <div onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-border/50 p-6">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-muted">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <h2 className="text-base font-semibold tracking-tight text-foreground">
                      Nuevo hueco disponible
                    </h2>
                  </div>

                  <button
                    onClick={onClose}
                    className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-muted"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>

                <div className="space-y-6 p-6">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">
                      Ubicación
                    </Label>

                    <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2">
                      <LocationSelector
                        onSelect={(id, location) => {
                          setSelectedLocationId(id ?? "");
                          setSelectedLocation(location ?? null);
                          setSelectedServices([]);
                        }}
                      />
                    </div>

                    {selectedLocation ? (
                      <p className="text-xs text-muted-foreground">
                        {selectedLocation.title}
                      </p>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                    <div className="space-y-2 sm:col-span-4">
                      <Label className="text-sm text-muted-foreground">
                        Fecha
                      </Label>
                      <Input
                        type="date"
                        value={dateValue}
                        onChange={(e) => setDateValue(e.target.value)}
                        className="h-10 rounded-xl border-0 bg-muted/50 focus-visible:ring-primary"
                      />
                    </div>

                    <div className="space-y-2 sm:col-span-1">
                      <Label className="text-sm text-muted-foreground">
                        Hora inicio
                      </Label>
                      <Input
                        type="time"
                        step={300}
                        value={startTimeValue}
                        onChange={(e) => setStartTimeValue(e.target.value)}
                        className="h-10 rounded-xl border-0 bg-muted/50 tabular-nums focus-visible:ring-primary"
                      />
                    </div>

                    <div className="space-y-2 sm:col-span-1">
                      <Label className="text-sm text-muted-foreground">
                        Hora fin
                      </Label>
                      <Input
                        type="time"
                        step={300}
                        value={endTimeValue}
                        onChange={(e) => setEndTimeValue(e.target.value)}
                        className="h-10 rounded-xl border-0 bg-muted/50 tabular-nums focus-visible:ring-primary"
                      />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label className="text-sm text-muted-foreground">
                        Nota
                      </Label>
                      <Input
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Opcional"
                        className="h-10 rounded-xl border-0 bg-muted/50 focus-visible:ring-primary"
                      />
                    </div>
                  </div>

                  <SlotServiceSelector
                    locationId={selectedLocationId}
                    slotDurationMin={slotDurationMin}
                    selectedServices={selectedServices}
                    onChange={setSelectedServices}
                  />

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

                <div className="p-6 pt-0">
                  <Button
                    onClick={handleCreate}
                    disabled={!canSubmit || created}
                    className="h-11 w-full rounded-xl bg-primary font-medium text-primary-foreground shadow-primary-glow transition-all duration-150 hover:bg-primary/90"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creando hueco...
                      </>
                    ) : null}

                    {!isSubmitting && !created ? "Crear hueco" : null}
                    {!isSubmitting && created ? "✓ Hueco creado" : null}
                  </Button>
                </div>
              </div>
            </StandardCard>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}