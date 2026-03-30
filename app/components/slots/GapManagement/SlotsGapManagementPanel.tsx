// app/components/slots/GapManagement/SlotsGapManagementPanel.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Clock, Percent, Users, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { GapWhatsAppPreview } from "@/app/components/slots/GapManagement/GapWhatsAppPreview";
import { SlotsCustomersPickerModal } from "@/app/components/slots/SendToContactsModal/SlotsSendToContactsModal";
import { SlotServiceSelector } from "@/app/components/slots/modal/SlotServiceSelector";
import type {
  SelectedServiceItem,
  SlotItem,
} from "@/app/components/slots/slots.types";

type Promotion = "none" | "10" | "25";

type SlotsGapManagementPanelProps = {
  open: boolean;
  onClose: () => void;
  day: string;
  slot: SlotItem | null;
  services: SelectedServiceItem[];
  companyId: string;
  locationId: string;
  templateBody: string;
  companyName: string;
  onSent?: () => void;
  onServicesSaved?: () => void;
};

const promotionOptions: { value: Promotion; label: string; desc: string }[] = [
  { value: "none", label: "Sin promo", desc: "Precio original" },
  { value: "10", label: "–10%", desc: "Descuento ligero" },
  { value: "25", label: "–25%", desc: "Oferta especial" },
];

function extractStartTime(slot: SlotItem | null): string {
  if (!slot) {
    return "17:00";
  }

  if (!slot.time) {
    return "17:00";
  }

  if (slot.time.includes("-")) {
    const parts = slot.time.split("-");
    const firstPart = parts[0];

    if (firstPart) {
      return firstPart.trim();
    }
  }

  return slot.time.trim();
}

function extractEndTime(slot: SlotItem | null): string {
  if (!slot) {
    return "18:00";
  }

  if (!slot.time) {
    return "18:00";
  }

  if (slot.time.includes("-")) {
    const parts = slot.time.split("-");
    const secondPart = parts[1];

    if (secondPart) {
      return secondPart.trim();
    }
  }

  return "18:00";
}

function normalizeDayLabel(day: string): string {
  if (!day) {
    return "";
  }

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
  if (!day) {
    return "";
  }

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

function timeToMinutes(value: string): number {
  const parts = value.split(":");

  if (parts.length < 2) {
    return 0;
  }

  const hour = Number(parts[0]);
  const minute = Number(parts[1]);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return 0;
  }

  return hour * 60 + minute;
}

function getDurationMinutes(start: string, end: string): number {
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);

  if (endMinutes <= startMinutes) {
    return 0;
  }

  return endMinutes - startMinutes;
}

function renderSentMessage(sentCount: number) {
  if (sentCount <= 0) {
    return null;
  }

  return (
    <p className="mt-2 text-xs font-medium text-primary">
      Ya se ha realizado un envío para este hueco en esta sesión.
    </p>
  );
}

function renderPanel(
  open: boolean,
  onClose: () => void,
  dateLabel: string,
  timeStart: string,
  durationMinutes: number,
  services: SelectedServiceItem[],
  setSelectedServices: (services: SelectedServiceItem[]) => void,
  onServicesSaved: (() => void) | undefined,
  companyId: string,
  locationId: string,
  slotId: string,
  promotion: Promotion,
  setPromotion: (value: Promotion) => void,
  clientCount: number[],
  setClientCount: (value: number[]) => void,
  subscribedOnly: boolean,
  setSubscribedOnly: (value: boolean) => void,
  sentCount: number,
  handleOpenCustomersModal: () => void,
  templateBody: string,
  companyName: string,
) {
  if (!open) {
    return null;
  }

  return (
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
        className="fixed right-0 top-0 bottom-0 z-50 flex w-full max-w-[440px] flex-col overflow-hidden bg-white shadow-[0_22px_60px_rgba(37,99,235,0.16)] sm:rounded-l-2xl"
      >
        <div className="flex items-center justify-between border-b border-border/50 px-6 pt-6 pb-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Gestionar hueco
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Configura y envía este hueco
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-muted active:scale-95"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-auto px-6 py-5">
          <div className="space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Fecha y hora
            </p>

            <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,0.7fr)_minmax(0,0.7fr)] gap-2">
              <div className="flex h-12 items-center gap-2 rounded-2xl border border-border/70 bg-muted/40 px-4">
                <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-sm font-medium text-foreground">
                  {dateLabel}
                </span>
              </div>

              <div className="flex h-12 items-center gap-2 rounded-2xl border border-border/70 bg-muted/40 px-4">
                <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-sm font-medium tabular-nums text-foreground">
                  {timeStart}
                </span>
              </div>

              <div className="flex h-12 items-center gap-2 rounded-2xl border border-border/70 bg-muted/40 px-4">
                <span className="text-sm font-medium tabular-nums text-foreground">
                  {durationMinutes} min
                </span>
              </div>
            </div>
          </div>


<SlotServiceSelector
  companyId={companyId}
  locationId={locationId}
  slotId={slotId}
  slotDurationMin={durationMinutes}
  selectedServices={services}
  onChange={(next) => setSelectedServices(next)}
  onSaved={onServicesSaved}
/>

          <div className="space-y-2.5">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Percent className="h-3 w-3" />
              Promoción
            </p>

            <div className="grid grid-cols-3 gap-2">
              {promotionOptions.map((option) => {
                const isActive = promotion === option.value;

                let wrapperClass =
                  "relative rounded-xl border-2 px-3 py-3 text-center transition-all duration-150 active:scale-[0.97] border-border/60 bg-muted/30 hover:border-border hover:bg-muted/60";
                let titleClass = "text-sm font-bold text-foreground";
                let descClass = "mt-0.5 text-[10px] text-muted-foreground";

                if (isActive) {
                  wrapperClass =
                    "relative rounded-xl border-2 px-3 py-3 text-center transition-all duration-150 active:scale-[0.97] border-primary bg-primary/5 shadow-sm";
                  titleClass = "text-sm font-bold text-primary";
                  descClass = "mt-0.5 text-[10px] text-primary/80";
                }

                return (
                  <button
                    key={option.value}
                    onClick={() => setPromotion(option.value)}
                    className={wrapperClass}
                  >
                    <p className={titleClass}>{option.label}</p>
                    <p className={descClass}>{option.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>




          <GapWhatsAppPreview
            services={services}
            promotion={promotion}
            day={dateLabel}
            timeStart={timeStart}
            templateBody={templateBody}
            companyName={companyName}
          />
        </div>

        <div className="border-t border-border/50 px-6 py-5">
          <Button
            onClick={handleOpenCustomersModal}
            className="h-12 w-full rounded-xl bg-primary font-semibold text-primary-foreground shadow-primary-glow transition-all duration-150 hover:bg-primary/90 active:scale-[0.98]"
          >
            Avisar a clientes
          </Button>
        </div>
      </motion.div>
    </>
  );
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
  const normalizedDay = useMemo(() => {
    return normalizeDayLabel(day);
  }, [day]);

  const dayChipLabel = useMemo(() => {
    return getDayChipLabel(day);
  }, [day]);

  const [date, setDate] = useState(normalizedDay);
  const [timeStart, setTimeStart] = useState(extractStartTime(slot));
  const [timeEnd, setTimeEnd] = useState(extractEndTime(slot));
  const [selectedServices, setSelectedServices] = useState<SelectedServiceItem[]>(services);
  const [clientCount, setClientCount] = useState([20]);
  const [subscribedOnly, setSubscribedOnly] = useState(true);
  const [promotion, setPromotion] = useState<Promotion>("none");
  const [customersModalOpen, setCustomersModalOpen] = useState(false);
  const [sentCount, setSentCount] = useState<number>(0);
  const [createCustomerModalOpen, setCreateCustomerModalOpen] = useState(false);
  const [slotsRefreshKey, setSlotsRefreshKey] = useState(0);

  const durationMinutes = useMemo(() => {
    return getDurationMinutes(timeStart, timeEnd);
  }, [timeStart, timeEnd]);

  useEffect(() => {
    setDate(normalizedDay);
  }, [normalizedDay]);

useEffect(() => {
  setTimeStart(extractStartTime(slot));
  setTimeEnd(extractEndTime(slot));
  setPromotion("none");
  setSentCount(0);
  setSelectedServices(services);
}, [slot, services]);

  function handleOpenCustomersModal() {
    if (!slot?.id) {
      console.error("Missing slotId");
      return;
    }

    if (!companyId) {
      console.error("Missing companyId");
      return;
    }

    setCustomersModalOpen(true);
  }

  function handleServicesSaved() {
  setSlotsRefreshKey((value) => value + 1);
}

  function handleSent() {
    setSentCount((current) => current + 1);
    setCustomersModalOpen(false);
    onClose();

    if (onSent) {
      onSent();
    }
  }

  return (
    <>
      <AnimatePresence>
{renderPanel(
  open,
  onClose,
  dayChipLabel,
  timeStart,
  durationMinutes,
  selectedServices,
  setSelectedServices,
  onServicesSaved,
  companyId,
  locationId,
  slot?.id || "",
  promotion,
  setPromotion,
  clientCount,
  setClientCount,
  subscribedOnly,
  setSubscribedOnly,
  sentCount,
  handleOpenCustomersModal,
  templateBody,
  companyName,
)}
      </AnimatePresence>

      <SlotsCustomersPickerModal
        open={customersModalOpen}
        onClose={() => setCustomersModalOpen(false)}
        companyId={companyId}
        slotId={slot?.id || ""}
        onSent={handleSent}
        onAddContact={() => {
          setCustomersModalOpen(false);
          setCreateCustomerModalOpen(true);
        }}
      />

      {createCustomerModalOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/30">
          <div className="rounded-2xl bg-white p-6 shadow-xl">
            <p className="text-sm font-medium">Modal crear contacto</p>
            <Button
              className="mt-4"
              onClick={() => setCreateCustomerModalOpen(false)}
            >
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </>
  );
}