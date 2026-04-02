// app/components/slots/Waitlist/WaitlistCard.tsx
"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Siren } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import StandardCard from "@/app/components/crussader/UX/standardCard";
import { SlotsWaitlistRow, type WaitlistRowItem } from "./SlotsWaitlistRow";
import { WaitlistInlineCreate } from "./WaitlistInlineCreate";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Props = {
  companyId: string | null;
  locationId: string | null;
  refreshKey?: number;
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
  createdAt: string;
  employees: WaitlistListResponseItemEmployee[];
};

const WAITLIST_LIST_ENDPOINT = "/api/slots/waitlist/list";
const WAITLIST_DELETE_ENDPOINT = "/api/slots/waitlist/delete";

export function WaitlistCard({
  companyId,
  locationId,
  refreshKey = 0,
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
console.log("[waitlist:list]", JSON.stringify(data.items, null, 2));

if (!response.ok || !data?.ok || !Array.isArray(data.items)) {
  setItems([]);
  return;
}

const nextItems: WaitlistRowItem[] = data.items.map(
  (item: WaitlistListResponseItem) => {
    console.log("[waitlist:item]", JSON.stringify(item, null, 2));

    return {
      id: String(item.id),
      customerName: String(item.customerName ?? ""),
      customerPhone: item.customerPhone ? String(item.customerPhone) : null,
      serviceName: item.serviceName ? String(item.serviceName) : null,
      note: item.note ? String(item.note) : null,
      isUrgent: Boolean(item.isUrgent),
      createdAt: String(item.createdAt),
      employees: Array.isArray(item.employees)
        ? item.employees.map((employee) => ({
            id: String(employee.id),
            name: String(employee.name ?? ""),
          }))
        : [],
    };
  }
);

        setItems(nextItems);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }

        console.error("[WaitlistCard] loadWaitlist", error);
        setItems([]);
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
        return;
      }
    } catch (error) {
      console.error("[WaitlistCard] handleRemove", error);
      setItems(previousItems);
    }
  }

  return (
    <StandardCard className="flex h-full min-h-[720px] flex-col border-border/60 bg-white">
<div className="border-b border-border/60 px-5 py-4">
  <div className="flex items-start justify-between gap-4">
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <h3 className="truncate text-[15px] font-semibold text-foreground">
          Lista de espera
          <span className="ml-1 text-muted-foreground">({items.length})</span>
        </h3>
      </div>

      <div className="mt-2 flex items-center gap-2 overflow-x-auto">
        <div className="shrink-0 rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
          Urgencias{" "}
          <span className="ml-1 font-semibold">
            {items.filter((item) => item.isUrgent).length}
          </span>
        </div>

        <div className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
          Nuevos{" "}
          <span className="ml-1 font-semibold">
            {items.filter((item) => item.isNewCustomer).length}
          </span>
        </div>
      </div>
    </div>

    <Button
      type="button"
      size="sm"
      onClick={() => setIsAdding((prev) => !prev)}
      disabled={!locationId}
      className={cn(
        "h-8 shrink-0 rounded-lg px-3 text-xs font-semibold transition-all duration-150",
        isAdding
          ? "border border-[#0B6CF4] bg-white text-slate-700 shadow-[0_2px_8px_rgba(11,108,244,0.12)] hover:bg-blue-50"
          : "bg-[#0B6CF4] text-white shadow-[0_2px_8px_rgba(11,108,244,0.18)] hover:bg-[#0a5ed8]"
      )}
    >
      {isAdding ? (
        "Cancelar"
      ) : (
        <>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Añadir
        </>
      )}
    </Button>
  </div>
</div>

      <div className="flex-1 overflow-hidden">
        <motion.div
          layout
          className="flex h-full flex-col gap-3 overflow-y-auto px-4 py-4"
        >
          {isAdding ? (
            <WaitlistInlineCreate
              companyId={companyId}
              locationId={locationId}
              onCancel={handleCancelCreate}
              onCreated={handleCreated}
            />
          ) : null}

          {loadingList ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : null}

          {!loadingList && items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
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
        <SlotsWaitlistRow
          item={item}
          onRemove={handleRemove}
        />
      </motion.div>
    ))}
  </AnimatePresence>
)}
        </motion.div>
      </div>
    </StandardCard>
  );
}