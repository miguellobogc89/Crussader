// app/components/slots/GapManagement/SlotsGapControlPanel.tsx

"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  Send,
  User,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import type { SlotDTO } from "@/hooks/slots/useSlots";
import { formatTimeRange } from "@/app/components/slots/helpers/AvailableSlotsListHelpers";
import {
  formatEuro,
  getEffectiveSlotStatus,
  getSlotPriceRange,
  resolveVisibleServices,
} from "@/app/components/slots/helpers/slotsWeeklyCalendarItemHelpers";

type SlotsGapControlPanelProps = {
  open: boolean;
  onClose: () => void;
  slot: SlotDTO | null;
};

function getStatusLabel(slot: SlotDTO | null): string {
  if (!slot) return "Sin estado";

  const status = getEffectiveSlotStatus(slot);

  if (status === "recovered") return "Recuperado";
  if (status === "expired") return "Vencido";
  if (status === "cancelled") return "Cancelado";
  if (status === "sent") return "Enviado";
  if (status === "pending_publish") return "Pendiente";

  return status;
}

function getPanelCopy(slot: SlotDTO | null) {
  const status = slot ? getEffectiveSlotStatus(slot) : "";

  if (status === "recovered") {
    return {
      title: "Hueco recuperado",
      subtitle: "Este hueco terminó generando una nueva reserva.",
      eyebrow: "Resultado positivo",
      accent: "emerald",
    };
  }

  if (status === "expired") {
    return {
      title: "Hueco vencido",
      subtitle: "Este hueco ya no está disponible para enviar.",
      eyebrow: "Sin recuperación",
      accent: "slate",
    };
  }

  if (status === "cancelled") {
    return {
      title: "Hueco cancelado",
      subtitle: "Este hueco fue cancelado manualmente.",
      eyebrow: "Cancelado",
      accent: "rose",
    };
  }

  return {
    title: "Control del hueco",
    subtitle: "Seguimiento del envío y respuestas.",
    eyebrow: "Resumen",
    accent: "blue",
  };
}

function getAccentClasses(accent: string) {
  if (accent === "emerald") {
    return {
      border: "border-emerald-200",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      icon: "text-emerald-600",
      shadow: "shadow-[0_10px_24px_rgba(16,185,129,0.10)]",
    };
  }

  if (accent === "rose") {
    return {
      border: "border-rose-200",
      bg: "bg-rose-50",
      text: "text-rose-700",
      icon: "text-rose-600",
      shadow: "shadow-[0_10px_24px_rgba(244,63,94,0.10)]",
    };
  }

  if (accent === "slate") {
    return {
      border: "border-slate-200",
      bg: "bg-slate-50",
      text: "text-slate-600",
      icon: "text-slate-500",
      shadow: "shadow-[0_10px_24px_rgba(15,23,42,0.06)]",
    };
  }

  return {
    border: "border-[#DBEAFE]",
    bg: "bg-blue-50",
    text: "text-[#2563EB]",
    icon: "text-[#2563EB]",
    shadow: "shadow-[0_10px_24px_rgba(37,99,235,0.08)]",
  };
}

function getMainIcon(slot: SlotDTO | null) {
  const status = slot ? getEffectiveSlotStatus(slot) : "";

  if (status === "recovered") return CheckCircle2;
  if (status === "expired" || status === "cancelled") return XCircle;

  return Calendar;
}

export function SlotsGapControlPanel({
  open,
  onClose,
  slot,
}: SlotsGapControlPanelProps) {
  const copy = getPanelCopy(slot);
  const accent = getAccentClasses(copy.accent);
  const MainIcon = getMainIcon(slot);
  const visibleServices = slot ? resolveVisibleServices(slot) : [];
  const priceRange = slot ? getSlotPriceRange(slot) : null;

  const [sendSummary, setSendSummary] = useState({
    sent: 0,
    interested: 0,
    rejected: 0,
  });

  const hasRecoveredCustomer =
    Boolean(slot?.recoveredCustomerName) ||
    Boolean(slot?.recoveredCustomerPhone) ||
    Boolean(slot?.recoveredCustomerEmail);

    useEffect(() => {
  const slotId = slot?.id ?? "";

  if (!slotId) {
    setSendSummary({
      sent: 0,
      interested: 0,
      rejected: 0,
    });
    return;
  }

  async function loadSummary() {
    try {
      const response = await fetch(
        `/api/slots/send/summary?slotId=${encodeURIComponent(slotId)}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data?.ok) {
        return;
      }

      setSendSummary({
        sent: Number(data.summary.sent ?? 0),
        interested: Number(data.summary.interested ?? 0),
        rejected: Number(data.summary.rejected ?? 0),
      });
    } catch (error) {
      console.error("[slot summary]", error);
    }
  }

  void loadSummary();
}, [slot?.id]);

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
            className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-[100vw] flex-col overflow-hidden bg-white shadow-[0_22px_60px_rgba(37,99,235,0.16)] sm:max-w-[420px] sm:rounded-l-2xl md:max-w-[440px] xl:max-w-[420px] xl2:max-w-[460px]"
          >
            <div className="flex items-center justify-between border-b border-border/50 px-4 pb-3 pt-4 sm:px-5 sm:pt-5 xl:px-5 xl:pb-4 xl2:px-6 xl2:pt-6">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold tracking-tight text-foreground xl:text-[15px] xl2:text-base">
                  {copy.title}
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground xl:text-xs xl2:text-sm">
                  {copy.subtitle}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-muted active:scale-95"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-auto px-4 py-4 sm:px-5 xl:space-y-4 xl:px-5 xl:py-4 xl2:space-y-6 xl2:px-6 xl2:py-5">
              <div
                className={[
                  "rounded-2xl border bg-white p-3 xl:p-3.5 xl2:p-4",
                  accent.border,
                  accent.shadow,
                ].join(" ")}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={[
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl xl:h-10 xl:w-10 xl2:h-11 xl2:w-11",
                      accent.bg,
                    ].join(" ")}
                  >
                    <MainIcon className={["h-5 w-5", accent.icon].join(" ")} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className={[
                        "text-[11px] font-semibold uppercase tracking-wider xl:text-[11px] xl2:text-xs",
                        accent.text,
                      ].join(" ")}
                    >
                      {copy.eyebrow}
                    </p>

                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-700 xl:text-xs xl2:text-sm">
                        <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                        <span className="font-semibold tabular-nums">
                          {slot
                            ? formatTimeRange(slot.startsAt, slot.endsAt)
                            : "--:--"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-700 xl:text-xs xl2:text-sm">
                        <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
                        <span>{getStatusLabel(slot)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {hasRecoveredCustomer ? (
                <div className="rounded-2xl border border-emerald-200 bg-white p-3 shadow-[0_10px_24px_rgba(16,185,129,0.08)] xl:p-3.5 xl2:p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 xl:text-[11px] xl2:text-xs">
                    Cliente recuperado
                  </p>

                  <div className="mt-3 flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 xl:h-9 xl:w-9 xl2:h-10 xl2:w-10">
                      <User className="h-4 w-4 text-emerald-600" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900 xl:text-sm xl2:text-[15px]">
                        {slot?.recoveredCustomerName || "Cliente sin nombre"}
                      </p>

                      <div className="mt-2 space-y-1.5">
                        {slot?.recoveredCustomerPhone ? (
                          <div className="flex items-center gap-2 text-xs text-slate-600 xl:text-xs xl2:text-sm">
                            <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">
                              {slot.recoveredCustomerPhone}
                            </span>
                          </div>
                        ) : null}

                        {slot?.recoveredCustomerEmail ? (
                          <div className="flex items-center gap-2 text-xs text-slate-600 xl:text-xs xl2:text-sm">
                            <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">
                              {slot.recoveredCustomerEmail}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-3 gap-2 xl:gap-2 xl2:gap-3">
                <div className="rounded-2xl border border-border/60 bg-white p-3 xl:p-3 xl2:p-4">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Send className="h-3.5 w-3.5 xl:h-3.5 xl:w-3.5 xl2:h-4 xl2:w-4" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">
                      Enviados
                    </span>
                  </div>
                  <p className="mt-2 text-lg font-semibold text-foreground xl:text-xl xl2:text-2xl">
                    {sendSummary.sent}
                  </p>
                </div>

                <div className="rounded-2xl border border-border/60 bg-white p-3 xl:p-3 xl2:p-4">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-3.5 w-3.5 xl:h-3.5 xl:w-3.5 xl2:h-4 xl2:w-4" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">
                      Interesados
                    </span>
                  </div>
                  <p className="mt-2 text-lg font-semibold text-foreground xl:text-xl xl2:text-2xl">
                    {sendSummary.interested}
                  </p>
                </div>

                <div className="rounded-2xl border border-border/60 bg-white p-3 xl:p-3 xl2:p-4">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 xl:h-3.5 xl:w-3.5 xl2:h-4 xl2:w-4" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">
                      Rechazados
                    </span>
                  </div>
                  <p className="mt-2 text-lg font-semibold text-foreground xl:text-xl xl2:text-2xl">
                    {sendSummary.rejected}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-white p-3 xl:p-3.5 xl2:p-4">
                <div className="space-y-2">
                  {visibleServices.length > 0 ? (
                    visibleServices.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 xl:px-3 xl:py-2 xl2:px-3.5 xl2:py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-slate-800 xl:text-xs xl2:text-sm">
                            {service.name}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {service.durationMin} min
                          </p>
                        </div>

                        <span className="shrink-0 text-xs font-semibold text-slate-700 xl:text-xs xl2:text-sm">
                          {formatEuro(service.price)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl bg-slate-50 px-3 py-4 text-xs text-muted-foreground xl:text-xs xl2:text-sm">
                      No hay servicios asociados a este hueco.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-white p-3 xl:p-3.5 xl2:p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 xl:text-[11px] xl2:text-xs">
                  Valor del hueco
                </p>

                <div className="mt-2 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xl font-semibold text-foreground xl:text-xl xl2:text-2xl">
                      {priceRange ? formatEuro(priceRange.max) : "0€"}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground xl:text-[11px] xl2:text-xs">
                      Importe estimado asociado al hueco.
                    </p>
                  </div>

                  <span
                    className={[
                      "rounded-full px-2.5 py-1 text-[11px] font-semibold xl:text-[11px] xl2:text-xs",
                      accent.bg,
                      accent.text,
                    ].join(" ")}
                  >
                    {getStatusLabel(slot)}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-border/50 px-4 py-4 sm:px-5 xl:px-5 xl:py-4 xl2:px-6 xl2:py-5">
              <Button
                variant="outline"
                onClick={onClose}
                className="h-11 w-full rounded-xl font-semibold xl:h-11 xl2:h-12"
              >
                Cerrar
              </Button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}