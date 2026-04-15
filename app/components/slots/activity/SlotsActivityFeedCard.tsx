// app/components/slots/activity/SlotsActivityFeedCard.tsx
"use client";

import { ReactNode, useEffect } from "react";
import { SlotsActivityFeedItem } from "./SlotsActivityFeedItem";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { getRecoveredToday } from "@/app/components/slots/helpers/slotsActivityFeedHelpers";
import { useSlotsActivity } from "@/hooks/slots/useSlotsActivity";

type SlotsActivityFeedCardProps = {
  locationId?: string | null;
  onHeaderChange?: (header: ReactNode) => void;
};

export function SlotsActivityFeedCard({
  locationId,
  onHeaderChange,
}: SlotsActivityFeedCardProps) {
  const { items, loading, error } = useSlotsActivity(locationId);

  const recoveredToday = getRecoveredToday(items);

  const cardHeader = (
    <div className="flex w-full flex-col justify-center">
      <div className="mb-1 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
        <h3 className="text-[13px] font-semibold tracking-tight text-foreground xl:text-sm xl2:text-[15px]">
          Actividad en Vivo
        </h3>
      </div>

      <p className="text-[11px] text-slate-500 xl:text-xs xl2:text-sm">
        Hoy has recuperado{" "}
        <span className="font-semibold text-emerald-500">
          {recoveredToday}
        </span>{" "}
        citas
      </p>
    </div>
  );

  useEffect(() => {
    if (!onHeaderChange) {
      return;
    }

    onHeaderChange(cardHeader);
  }, [onHeaderChange, recoveredToday]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {error ? (
        <p className="px-3 pt-3 text-[11px] text-red-500 xl:px-4 xl:text-xs xl2:px-5 xl2:text-sm">
          {error}
        </p>
      ) : null}

      <div className="min-h-0 flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="px-3 pb-3 pt-3 xl:px-4 xl:pb-4 xl:pt-4 xl2:px-5 xl2:pb-5 xl2:pt-5">
            <div className="relative">
              <div className="absolute bottom-2.5 left-[12px] top-2.5 w-px bg-slate-200 xl:left-[14px] xl2:left-[15px]" />

              <div className="space-y-1 xl:space-y-1.5">
                {items.map((item, index) => (
                  <SlotsActivityFeedItem
                    key={item.id}
                    item={item}
                    index={index}
                  />
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}