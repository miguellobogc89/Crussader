// app/components/slots/GapManagement/SlotsGapManagementPanel.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "@/app/components/ui/use-toast";
import { Calendar, Clock, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { GapWhatsAppPreview } from "@/app/components/slots/GapManagement/GapWhatsAppPreview";
import { SlotsCustomersPickerModal } from "@/app/components/slots/SendToContactsModal/SlotsSendToContactsModal";
import { SlotServiceSelector } from "@/app/components/slots/modal/SlotServiceSelector";
import type { SlotDTO } from "@/hooks/slots/useSlots";
import type { SelectedServiceItem } from "@/app/components/slots/slots.types";

type SlotsGapManagementPanelProps = {
  open: boolean;
  onClose: () => void;
  day: string;
  slot: SlotDTO | null;
  services: SelectedServiceItem[];
  companyId: string;
  locationId: string;
  templateBody: string;
  companyName: string;
  onSent?: () => void;
  onServicesSaved?: () => void;
};

function extractStartTime(slot: SlotDTO | null): string {
  if (!slot?.startsAt) {
    return "17:00";
  }

  const date = new Date(slot.startsAt);

  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function extractEndTime(slot: SlotDTO | null): string {
  if (!slot?.endsAt) {
    return "18:00";
  }

  const date = new Date(slot.endsAt);

  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function extractDate(slot: SlotDTO | null): string {
  if (!slot?.startsAt) {
    return "";
  }

  const date = new Date(slot.startsAt);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function buildLocalDateTime(date: string, time: string): string {
  return `${date}T${time}:00`;
}

function normalizeDayLabel(day: string): string {
  if (!day) return "";

  const parts = day.split(",");

  if (parts.length > 1) {
    const secondPart = parts[1];

    if (secondPart) {
      const trimmedSecondPart = secondPart.trim();

      if (trimmedSecondPart.includes(":")) {
        return parts[0].trim();
      }
    }
  }

  return day.trim();
}

function getDayChipLabel(day: string): string {
  if (!day) return "";

  const normalized = normalizeDayLabel(day);
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return normalized;
  }

  const weekday = new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
  }).format(parsed);

  const dayNumber = new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
  }).format(parsed);

  const monthNumber = new Intl.DateTimeFormat("es-ES", {
    month: "2-digit",
  }).format(parsed);

  return `${weekday}, ${dayNumber}/${monthNumber}`;
}

function getWhatsAppPreviewDayLabel(value: string): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  function isSameDay(a: Date, b: Date) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  const weekday = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
  }).format(parsed);

  const dayNumber = new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
  }).format(parsed);

  const monthNumber = new Intl.DateTimeFormat("es-ES", {
    month: "2-digit",
  }).format(parsed);

  if (isSameDay(parsed, today)) {
    return `hoy ${weekday}, ${dayNumber}/${monthNumber}`;
  }

  if (isSameDay(parsed, tomorrow)) {
    return `mañana ${weekday}, ${dayNumber}/${monthNumber}`;
  }

  return `${weekday}, ${dayNumber}/${monthNumber}`;
}

function timeToMinutes(value: string): number {
  const parts = value.split(":");

  if (parts.length < 2) return 0;

  const hour = Number(parts[0]);
  const minute = Number(parts[1]);

  if (Number.isNaN(hour) || Number.isNaN(minute)) return 0;

  return hour * 60 + minute;
}

function getDurationMinutes(start: string, end: string): number {
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);

  if (endMinutes <= startMinutes) return 0;

  return endMinutes - startMinutes;
}

export function SlotsGapManagementPanel({
  open,
  onClose,
  day,
  slot,
  services,
  companyId,
  locationId,
  templateBody,
  companyName,
  onSent,
  onServicesSaved,
}: SlotsGapManagementPanelProps) {
  const normalizedDay = useMemo(() => normalizeDayLabel(day), [day]);
  const dayChipLabel = useMemo(() => getDayChipLabel(day), [day]);

  const [date, setDate] = useState(extractDate(slot));
  const [timeStart, setTimeStart] = useState(extractStartTime(slot));
  const [timeEnd, setTimeEnd] = useState(extractEndTime(slot));
  const [selectedServices, setSelectedServices] = useState<
    SelectedServiceItem[]
  >(services);
    const [customersModalOpen, setCustomersModalOpen] = useState(false);
const [sendSummary, setSendSummary] = useState({
  sent: 0,
  rejected: 0,
  notRead: 0,
});
  const [isSavingTime, setIsSavingTime] = useState(false);
  const [timeSaveError, setTimeSaveError] = useState("");
  const lastSavedTimeSignatureRef = useRef("");

  const durationMinutes = useMemo(() => {
    return getDurationMinutes(timeStart, timeEnd);
  }, [timeStart, timeEnd]);

  useEffect(() => {
    setDate(extractDate(slot));
    setTimeStart(extractStartTime(slot));
    setTimeEnd(extractEndTime(slot));
    lastSavedTimeSignatureRef.current = `${extractDate(slot)}|${extractStartTime(slot)}|${extractEndTime(slot)}`;

    if (!slot) {
      setSelectedServices([]);
      return;
    }

setSelectedServices(Array.isArray(services) ? services : []);

  }, [slot, services]);

useEffect(() => {
  const slotId = slot?.id ?? "";

  if (!slotId) {
    setSendSummary({
      sent: 0,
      rejected: 0,
      notRead: 0,
    });
    return;
  }

  async function loadSummary() {
    try {
      const response = await fetch(
        `/api/slots/send/summary?slotId=${encodeURIComponent(slotId)}`,
        { cache: "no-store" }
      );

      const data = await response.json();

      if (!response.ok || !data?.ok) {
        return;
      }

      setSendSummary({
        sent: Number(data.summary.sent ?? 0),
        rejected: Number(data.summary.rejected ?? 0),
        notRead: Number(data.summary.notRead ?? 0),
      });
    } catch (error) {
      console.error("[summary fetch]", error);
    }
  }

  void loadSummary();
}, [slot?.id]);

  useEffect(() => {
    if (!slot?.id) {
      return;
    }
    const slotId = slot.id;

    if (!date || !timeStart || !timeEnd) {
      return;
    }

    if (durationMinutes <= 0) {
      return;
    }

    const nextSignature = `${date}|${timeStart}|${timeEnd}`;

    if (nextSignature === lastSavedTimeSignatureRef.current) {
      return;
    }

    const timeout = window.setTimeout(async () => {
      try {
        setIsSavingTime(true);
        setTimeSaveError("");
        const slotId = slot.id;

const response = await fetch("/api/slots/update", {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    slotId,
    startsAt: buildLocalDateTime(date, timeStart),
    endsAt: buildLocalDateTime(date, timeEnd),
  }),
});

const data = await response.json();

if (!response.ok || !data?.ok) {
  throw new Error(data?.error || "No se pudo guardar la fecha.");
}

        lastSavedTimeSignatureRef.current = nextSignature;

        toast({
          variant: "success",
          title: "Cambios guardados",
          description: "La fecha y hora del hueco se han actualizado correctamente.",
        });

      } catch (error) {
        console.error("[slots] autosave time error", error);
        setTimeSaveError("No se pudo guardar la fecha.");
      } finally {
        setIsSavingTime(false);
      }
    }, 500);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [slot?.id, date, timeStart, timeEnd, durationMinutes, onServicesSaved]);

  function handleOpenCustomersModal() {
    if (!slot?.id) return;
    if (!companyId) return;

    setCustomersModalOpen(true);
  }

  function prefetchCustomersModal() {
    if (!slot?.id || !companyId) return;

    const params = new URLSearchParams();
    params.set("companyId", companyId);
    params.set("slotId", slot.id);
    params.set("limit", "50");

    fetch(`/api/slots/customers/list?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
    }).catch((error) => {
      console.error("[slots] prefetch customers error", error);
    });
  }

  function handleServicesSaved() {
    onServicesSaved?.();
  }

  function handleSent() {
    setCustomersModalOpen(false);
    onClose();
    onSent?.();
  }

  return (
    <>
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
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-[100vw] flex-col overflow-hidden bg-white shadow-[0_22px_60px_rgba(37,99,235,0.16)] sm:max-w-[420px] sm:rounded-l-2xl md:max-w-[440px] xl:max-w-[420px] xl2:max-w-[460px]"
            >
              <div className="flex items-center justify-between border-b border-border/50 px-4 pb-3 pt-4 sm:px-5 sm:pt-5 xl:px-5 xl:pb-4 xl2:px-6 xl2:pt-6">
                <div>
                  <h2 className="text-sm font-semibold tracking-tight text-foreground xl:text-base">
                    Gestionar hueco
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground xl:text-sm">
                    Configura y envía este hueco
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-muted active:scale-95"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-auto px-4 py-4 sm:px-5 xl:space-y-5 xl:px-5 xl:py-5 xl2:px-6 xl2:space-y-6">
                <div className="rounded-2xl border border-[#DBEAFE] bg-white p-3 shadow-[0_10px_24px_rgba(37,99,235,0.08)] xl:p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#2563EB] xl:text-xs">
                        Fecha y hora
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500 xl:text-xs">
                        Ajusta el hueco antes de avisar a clientes.
                      </p>
                    </div>

                    {isSavingTime ? (
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                        Guardando...
                      </span>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1.35fr)_minmax(0,0.8fr)_minmax(0,0.8fr)]">
                    <label className="space-y-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Fecha
                      </span>
                      <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm transition-all duration-200 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100">
                        <input
                          type="date"
                          value={date}
                          onChange={(event) => setDate(event.target.value)}
                          className="h-full min-w-0 flex-1 bg-transparent text-xs font-semibold text-slate-800 outline-none xl:text-sm"
                        />
                      </div>
                    </label>

                    <label className="space-y-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Inicio
                      </span>
                      <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm transition-all duration-200 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100">
                        <input
                          type="time"
                          value={timeStart}
                          onChange={(event) => setTimeStart(event.target.value)}
                          className="h-full min-w-0 flex-1 bg-transparent text-xs font-semibold tabular-nums text-slate-800 outline-none xl:text-sm"
                        />
                      </div>
                    </label>

                    <label className="space-y-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Fin
                      </span>
                      <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm transition-all duration-200 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100">
                        <input
                          type="time"
                          value={timeEnd}
                          onChange={(event) => setTimeEnd(event.target.value)}
                          className="h-full min-w-0 flex-1 bg-transparent text-xs font-semibold tabular-nums text-slate-800 outline-none xl:text-sm"
                        />
                      </div>
                    </label>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                      {durationMinutes} min
                    </span>

                    {timeSaveError ? (
                      <span className="text-[11px] font-semibold text-rose-600">
                        {timeSaveError}
                      </span>
                    ) : null}
                  </div>
                </div>

<SlotServiceSelector
  locationId={locationId}
  employeeId={slot?.employeeId || ""}
  slotId={slot?.id || ""}
  slotDurationMin={durationMinutes}
  selectedServices={selectedServices}
  onChange={setSelectedServices}
  onSaved={handleServicesSaved}
/>

                <GapWhatsAppPreview
                  services={selectedServices}
                  promotion="none"
                  day={date}
                  timeStart={timeStart}
                  templateBody={templateBody}
                  companyName={companyName}
                  specialistName={slot?.employeeName ?? "nuestro especialista"}
                />

                <div className="rounded-2xl border border-[#DBEAFE] bg-white p-3 shadow-[0_10px_24px_rgba(37,99,235,0.08)] xl:p-4">
  <div className="mb-3">
    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#2563EB] xl:text-xs">
      Estado de envíos
    </p>
  </div>

  <div className="grid grid-cols-3 gap-2">
    <div className="rounded-xl bg-slate-50 px-3 py-2 text-center">
      <p className="text-[10px] text-slate-500">Enviados</p>
      <p className="text-sm font-semibold text-slate-800">
        {sendSummary.sent}
      </p>
    </div>

    <div className="rounded-xl bg-slate-50 px-3 py-2 text-center">
      <p className="text-[10px] text-slate-500">Pendientes</p>
      <p className="text-sm font-semibold text-slate-800">
        {sendSummary.notRead}
      </p>
    </div>


    <div className="rounded-xl bg-rose-50 px-3 py-2 text-center">
      <p className="text-[10px] text-rose-600">Rechazados</p>
      <p className="text-sm font-semibold text-rose-700">
        {sendSummary.rejected}
      </p>
    </div>

  </div>
</div>
              </div>

              <div className="border-t border-border/50 px-4 py-4 sm:px-5 xl:px-5 xl:py-5 xl2:px-6">
                <Button
                  onMouseEnter={prefetchCustomersModal}
                  onFocus={prefetchCustomersModal}
                  onClick={handleOpenCustomersModal}
                  className="h-11 w-full rounded-xl bg-primary font-semibold text-primary-foreground shadow-primary-glow transition-all duration-300 ease-out hover:bg-primary/90 active:scale-[0.98] xl:h-12"
                >
                  Avisar a clientes
                </Button>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <SlotsCustomersPickerModal
        open={customersModalOpen}
        onClose={() => setCustomersModalOpen(false)}
        companyId={companyId}
        slotId={slot?.id || ""}
        onSent={handleSent}
      />
    </>
  );
}