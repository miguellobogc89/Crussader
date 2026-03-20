// app/components/slots/GapManagement/SlotsGapManagementPanel.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Clock, Percent, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { GapDeliveryOptions } from "@/app/components/slots/GapManagement/GapDeliveryOptions";
import { GapServicesEditor } from "@/app/components/slots/GapManagement/GapServicesEditor";
import { GapWhatsAppPreview } from "@/app/components/slots/GapManagement/GapWhatsAppPreview";
import type {
  SelectedServiceItem,
  SlotItem,
} from "@/app/components/slots/slots.types";

type SlotsGapManagementPanelProps = {
  open: boolean;
  onClose: () => void;
  day: string;
  slot: SlotItem | null;
  services: SelectedServiceItem[];
};

type Promotion = "none" | "10" | "25";

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

export function SlotsGapManagementPanel({
  open,
  onClose,
  day,
  slot,
  services,
}: SlotsGapManagementPanelProps) {
  const normalizedDay = useMemo(() => {
    return normalizeDayLabel(day);
  }, [day]);

  const [date, setDate] = useState(normalizedDay);
  const [timeStart, setTimeStart] = useState(extractStartTime(slot));
  const [timeEnd, setTimeEnd] = useState(extractEndTime(slot));
  const [clientCount, setClientCount] = useState([20]);
  const [subscribedOnly, setSubscribedOnly] = useState(true);
  const [promotion, setPromotion] = useState<Promotion>("none");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    setDate(normalizedDay);
  }, [normalizedDay]);

  useEffect(() => {
    setTimeStart(extractStartTime(slot));
    setTimeEnd(extractEndTime(slot));
    setPromotion("none");
    setSent(false);
  }, [slot]);

  const handleSend = () => {
    setSent(true);

    window.setTimeout(() => {
      setSent(false);
      onClose();
    }, 1500);
  };

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

                <div className="grid grid-cols-[1fr_auto_auto] gap-2">
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="h-10 rounded-xl border-border/60 bg-muted/50 pl-9 text-sm font-medium"
                    />
                  </div>

                  <div className="relative">
                    <Clock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={timeStart}
                      onChange={(e) => setTimeStart(e.target.value)}
                      className="h-10 w-[96px] rounded-xl border-border/60 bg-muted/50 pl-9 text-sm font-medium tabular-nums"
                    />
                  </div>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      –
                    </span>
                    <Input
                      value={timeEnd}
                      onChange={(e) => setTimeEnd(e.target.value)}
                      className="h-10 w-[96px] rounded-xl border-border/60 bg-muted/50 pl-7 text-sm font-medium tabular-nums"
                    />
                  </div>
                </div>
              </div>

              <GapServicesEditor
                services={services}
                promotion={promotion}
                onAdd={() => {}}
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

              <GapDeliveryOptions
                clientCount={clientCount}
                onClientCountChange={setClientCount}
                subscribedOnly={subscribedOnly}
                onSubscribedOnlyChange={setSubscribedOnly}
              />

              <GapWhatsAppPreview
                services={services}
                promotion={promotion}
                day={date}
                timeStart={timeStart}
              />
            </div>

            <div className="border-t border-border/50 px-6 py-5">
              <Button
                onClick={handleSend}
                disabled={sent}
                className="h-12 w-full rounded-xl bg-primary font-semibold text-primary-foreground shadow-primary-glow transition-all duration-150 hover:bg-primary/90 active:scale-[0.98]"
              >
                {sent ? "✓ Enviado" : "Avisar a clientes"}
              </Button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}