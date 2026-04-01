// app/components/slots/Waitlist/WaitlistCard.tsx
"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Siren } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import StandardCard from "@/app/components/crussader/UX/standardCard";
import { SlotsWaitlistRow, type WaitlistRowItem } from "./SlotsWaitlistRow";
import { WaitlistInlineCreate } from "./WaitlistInlineCreate";

type Props = {
  companyId: string | null;
  locationId: string | null;
  refreshKey?: number;
};

type WaitlistListResponseItem = {
  id: string;
  customerName: string;
  customerPhone: string | null;
  serviceName: string | null;
  note: string | null;
  isUrgent: boolean;
  createdAt: string;
};

const WAITLIST_LIST_ENDPOINT = "/api/slots/waitlist/list";

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

        if (!response.ok || !data?.ok || !Array.isArray(data.items)) {
          setItems([]);
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
            createdAt: String(item.createdAt),
          })
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

  return (
    <StandardCard className="flex h-full min-h-[720px] flex-col border-border/60 bg-white">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Siren className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-foreground">
                Panel de acción rápida
              </h3>
              <p className="text-xs text-muted-foreground">
                Llamadas sin cita y urgencias del día
              </p>
            </div>
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={() => setIsAdding(true)}
          className="h-9 rounded-xl px-3 text-xs font-medium"
          disabled={!locationId || isAdding}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Añadir
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="flex h-full flex-col gap-3 overflow-y-auto px-4 py-4">
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

          {!loadingList &&
            items.map((item) => {
              return <SlotsWaitlistRow key={item.id} item={item} />;
            })}
        </div>
      </div>
    </StandardCard>
  );
}