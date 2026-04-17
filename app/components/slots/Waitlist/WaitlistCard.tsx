// app/components/slots/Waitlist/WaitlistCard.tsx
"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { SlotsWaitlistRow, type WaitlistRowItem } from "./SlotsWaitlistRow";
import { WaitlistInlineCreate } from "./WaitlistInlineCreate";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Props = {
  companyId: string | null;
  locationId: string | null;
  refreshKey?: number;
  onHeaderChange?: (header: React.ReactNode) => void;
};

type WaitlistListResponseItemEmployee = {
  id: string;
  name: string;
};

type WaitlistListResponseItem = {
  id: string;
  customerName: string;
  customerPhone: string | null;
  serviceName: string | null;
  note: string | null;
  isUrgent: boolean;
  isNewCustomer?: boolean;
  createdAt: string;
  employees: WaitlistListResponseItemEmployee[];
};

const WAITLIST_LIST_ENDPOINT = "/api/slots/waitlist/list";
const WAITLIST_DELETE_ENDPOINT = "/api/slots/waitlist/delete";

export function WaitlistCard({
  companyId,
  locationId,
  refreshKey = 0,
  onHeaderChange,
}: Props) {

  const [items, setItems] = useState<WaitlistRowItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {

    if (!locationId) {
      setItems([]);
      return;
    }

    const safeLocationId = locationId;
    const controller = new AbortController();

    async function loadWaitlist() {

      try {
        setLoadingList(true);

        const params = new URLSearchParams();
        params.set("locationId", safeLocationId);

        const response = await fetch(
          `${WAITLIST_LIST_ENDPOINT}?${params.toString()}`,
          {
            method: "GET",
            signal: controller.signal,
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok || !data?.ok || !Array.isArray(data.items)) {
          console.error("[WaitlistCard] invalid waitlist response", data);
          return;
        }

        const nextItems: WaitlistRowItem[] = data.items.map(
          (item: WaitlistListResponseItem) => ({
            id: String(item.id),
            customerName: String(item.customerName ?? ""),
            customerPhone: item.customerPhone ? String(item.customerPhone) : null,
            serviceName: item.serviceName ? String(item.serviceName) : null,
            note: item.note ? String(item.note) : null,
            isUrgent: Boolean(item.isUrgent),
            isNewCustomer: Boolean(item.isNewCustomer),
            createdAt: String(item.createdAt),
            employees: Array.isArray(item.employees)
              ? item.employees.map((employee) => ({
                  id: String(employee.id),
                  name: String(employee.name ?? ""),
                }))
              : [],
          })
        );

        setItems(nextItems);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }

        console.error("[WaitlistCard] loadWaitlist", error);
      } finally {
        setLoadingList(false);
      }
    }

    void loadWaitlist();

    return () => controller.abort();
  }, [locationId, refreshKey]);

  function handleCreated(item: WaitlistRowItem) {
    setItems((prev) => [item, ...prev]);
    setIsAdding(false);
  }

  function handleCancelCreate() {
    setIsAdding(false);
  }

  async function handleRemove(id: string) {
    const previousItems = items;

    setItems((prev) => prev.filter((item) => item.id !== id));

    try {
      const response = await fetch(WAITLIST_DELETE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok || !data?.ok) {
        setItems(previousItems);
      }
    } catch (error) {
      console.error("[WaitlistCard] handleRemove", error);
      setItems(previousItems);
    }
  }

  const urgentCount = items.filter((item) => item.isUrgent).length;
  const newCount = items.filter((item) => item.isNewCustomer).length;

  const cardHeader = (
  <div className="flex w-full items-start gap-3 xl2:gap-4">
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <h3 className="truncate text-[13px] font-semibold text-foreground xl:text-sm xl2:text-[15px]">
          Lista de espera
          <span className="ml-1 text-muted-foreground">({items.length})</span>
        </h3>
      </div>

      <div className="mt-1.5 flex items-center gap-1.5 overflow-x-auto xl2:mt-2 xl2:gap-2">
        <div className="shrink-0 rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-700 xl2:px-3 xl2:py-1 xl2:text-xs">
          Urgencias
          <span className="ml-1 font-semibold">{urgentCount}</span>
        </div>

        <div className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 xl2:px-3 xl2:py-1 xl2:text-xs">
          Nuevos
          <span className="ml-1 font-semibold">{newCount}</span>
        </div>
      </div>
    </div>
  </div>
  );

useEffect(() => {
  if (!onHeaderChange) {
    return;
  }

  onHeaderChange(cardHeader);
}, [items.length, urgentCount, newCount, onHeaderChange]);

  return (
    <div className="flex h-full flex-col">

      <div className="flex-1 overflow-hidden">
        <motion.div
          layout
          className="flex h-full flex-col gap-2 overflow-y-auto px-3 py-3 xl:px-4 xl:py-4 xl2:gap-3"
        >

          <motion.div layout>
            <Button
              type="button"
              size="sm"
              onClick={() => setIsAdding((prev) => !prev)}
              disabled={!locationId}
              className={cn(
                "h-8 w-full justify-center rounded-xl px-3 text-[11px] font-semibold transition-all duration-150 xl:h-9 xl:text-xs",
                isAdding
                  ? "border border-[#0B6CF4] bg-white text-slate-700 shadow-[0_2px_8px_rgba(11,108,244,0.12)] hover:bg-blue-50"
                  : "bg-[#0B6CF4] text-white shadow-[0_2px_8px_rgba(11,108,244,0.18)] hover:bg-[#0a5ed8]"
              )}
            >
              {isAdding ? (
                "Cancelar"
              ) : (
                <>
                  <Plus className="mr-1 h-3 w-3 xl:mr-1.5 xl:h-3.5 xl:w-3.5" />
                  Nuevo
                </>
              )}
            </Button>
          </motion.div>
          {isAdding ? (
            <WaitlistInlineCreate
              companyId={companyId}
              locationId={locationId}
              onCancel={handleCancelCreate}
              onCreated={handleCreated}
            />
          ) : null}

          {loadingList ? (
            <div className="flex items-center justify-center py-8 xl:py-10">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground xl:h-5 xl:w-5" />
            </div>
          ) : null}

          {!loadingList && items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-3 py-6 text-center text-xs text-muted-foreground xl:px-4 xl:py-8 xl:text-sm">
              No hay entradas activas en la lista
            </div>
          ) : null}

          {!loadingList && (
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
                  <SlotsWaitlistRow item={item} onRemove={handleRemove} />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </motion.div>
      </div>
    </div>
  );
}