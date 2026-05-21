// app/components/slots/CancelledAppointments/CancelledAppointmentsList.tsx
"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { CancelledAppointmentRow } from "./CancelledAppointmentItem";

type Props = {
  companyId: string | null;
  locationId: string | null;
  refreshKey?: number;
  createdAppointmentId?: string | null;
  onHeaderChange?: (header: React.ReactNode) => void;
  onCreateSlot?: (appointment: CancelledAppointmentItem) => void;
};

export type CancelledAppointmentItem = {
  id: string;
  startAt: string;
  endAt: string;
  title: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  serviceName: string | null;
  employeeId: string | null;
  employeeName: string | null;
  notes: string | null;
  source: "google" | "crussader";
  cancelledAt: string | null;
};

type CancelledAppointmentsResponseItem = {
  id: string;
  startAt: string;
  endAt: string;
  title?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  serviceName?: string | null;
  employeeId?: string | null;
  employeeName?: string | null;
  notes?: string | null;
  source?: "google" | "crussader";
  cancelledAt?: string | null;
};

const CANCELLED_APPOINTMENTS_ENDPOINT =
  "/api/calendar/appointments/cancelled";

export function CancelledAppointmentsList({
  locationId,
  refreshKey = 0,
  createdAppointmentId = null,
  onHeaderChange,
  onCreateSlot,
}: Props) {
  const [items, setItems] = useState<CancelledAppointmentItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [localRefreshKey, setLocalRefreshKey] = useState(0);

  useEffect(() => {
    if (!createdAppointmentId) {
      return;
    }

    setItems((prev) => {
      return prev.filter((item) => item.id !== createdAppointmentId);
    });
  }, [createdAppointmentId]);

  useEffect(() => {
    if (!locationId) {
      setItems([]);
      return;
    }

    const safeLocationId = locationId;
    const controller = new AbortController();

    async function loadCancelledAppointments() {
      try {
        setLoadingList(true);

        const params = new URLSearchParams();
        params.set("locationId", safeLocationId);

        const response = await fetch(
          `${CANCELLED_APPOINTMENTS_ENDPOINT}?${params.toString()}`,
          {
            method: "GET",
            signal: controller.signal,
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok || !data?.ok || !Array.isArray(data.items)) {
          setItems([]);
          return;
        }

        const nextItems: CancelledAppointmentItem[] = data.items.map(
          (item: CancelledAppointmentsResponseItem) => ({
            id: String(item.id),
            startAt: String(item.startAt),
            endAt: String(item.endAt),
            title: item.title ? String(item.title) : null,
            customerName: item.customerName ? String(item.customerName) : null,
            customerPhone: item.customerPhone ? String(item.customerPhone) : null,
            customerEmail: item.customerEmail ? String(item.customerEmail) : null,
            serviceName: item.serviceName ? String(item.serviceName) : null,
            employeeId: item.employeeId ? String(item.employeeId) : null,
            employeeName: item.employeeName ? String(item.employeeName) : null,
            notes: item.notes ? String(item.notes) : null,
            source: item.source === "crussader" ? "crussader" : "google",
            cancelledAt: item.cancelledAt ? String(item.cancelledAt) : null,
          })
        );

        setItems(nextItems);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }

        console.error(
          "[CancelledAppointmentsList] loadCancelledAppointments",
          error
        );
      } finally {
        setLoadingList(false);
      }
    }

    void loadCancelledAppointments();

    return () => controller.abort();
  }, [locationId, refreshKey, localRefreshKey]);

  const cardHeader = (
    <div className="flex w-full items-start justify-between gap-3 xl2:gap-4">
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-[13px] font-semibold text-foreground xl:text-sm xl2:text-[15px]">
          Citas canceladas
          <span className="ml-1 text-muted-foreground">({items.length})</span>
        </h3>

        <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground xl2:text-xs">
          Cancelaciones próximas listas para convertirse en huecos disponibles.
        </p>
      </div>

      <Button
        type="button"
        size="icon"
        variant="ghost"
        disabled={loadingList || !locationId}
        onClick={() => setLocalRefreshKey((prev) => prev + 1)}
        className="h-8 w-8 shrink-0 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
      >
        <RefreshCw
          className={[
            "h-4 w-4",
            loadingList ? "animate-spin" : "",
          ].join(" ")}
        />
      </Button>
    </div>
  );

  useEffect(() => {
    if (!onHeaderChange) {
      return;
    }

    onHeaderChange(cardHeader);
  }, [items.length, loadingList, locationId, onHeaderChange]);

  return (
    <div className="flex h-full flex-col">
      <div className="relative flex-1 overflow-hidden">

        {/* fade TOP */}
        <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 h-6 bg-gradient-to-b from-white to-transparent" />

        {/* fade BOTTOM */}
        <div className="pointer-events-none absolute left-0 right-0 bottom-0 z-10 h-6 bg-gradient-to-t from-white to-transparent" />

        <motion.div
          layout
          className="flex h-full flex-col gap-2 overflow-y-auto px-3 py-3 xl:px-4 xl:py-4 xl2:gap-3"
        >
          {loadingList ? (
            <div className="flex items-center justify-center py-8 xl:py-10">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground xl:h-5 xl:w-5" />
            </div>
          ) : null}

          {!loadingList && items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-3 py-6 text-center text-xs text-muted-foreground xl:px-4 xl:py-8 xl:text-sm">
              No hay citas canceladas pendientes de convertir.
            </div>
          ) : null}

          {!loadingList ? (
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                >
                  <CancelledAppointmentRow
                    item={item}
                    onCreateSlot={onCreateSlot}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          ) : null}
        </motion.div>
      </div>
    </div>
  );
}