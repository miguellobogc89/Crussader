// app/components/slots/SlotsPageShell.tsx
"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { SlotsStatsCard } from "./SlotsStatsCard";
import { SlotsListCard } from "./AvailableSlotsList";
import { SlotsActivityFeedCard } from "./activity/SlotsActivityFeedCard";
import type { SlotItem, SelectedServiceItem } from "./slots.types";
import { WaitlistCard } from "./Waitlist/WaitlistCard";
import StandardCard from "@/app/components/crussader/UX/standardCard";

type SlotsPageShellProps = {
  companyId: string | null;
  locationId: string | null;
  onNewCancellation: () => void;
  onInvite: () => void;
  onSlotClick: (
    day: string,
    slot: SlotItem,
    services: SelectedServiceItem[],
    locationId: string | null,
  ) => void;
  refreshKey?: number;
};

export function SlotsPageShell({
  companyId,
  locationId,
  onNewCancellation,
  onSlotClick,
  refreshKey,
}: SlotsPageShellProps) {
  const [slotsListHeader, setSlotsListHeader] = useState<React.ReactNode>(null);
  const [waitlistHeader, setWaitlistHeader] = useState<React.ReactNode>(null);
  const [activityHeader, setActivityHeader] = useState<React.ReactNode>(null);

  const effectiveLocationId = locationId;
  const effectiveCompanyId = companyId;

  if (!effectiveLocationId) {
    return null;
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden px-3 pb-3 pt-1 lg:px-4 lg:pb-4 lg:pt-1 xl:px-5 xl:pb-5 xl:pt-1 xl2:px-6 xl2:pb-6 xl2:pt-6">
      <div className="flex shrink-0 items-center justify-between gap-3 lg:gap-4 xl:gap-5 xl2:gap-6">
        <div className="min-w-0 flex-1 px-4 py-2">
          {effectiveCompanyId ? (
            <SlotsStatsCard
              companyId={effectiveCompanyId}
              locationId={effectiveLocationId}
            />
          ) : null}
        </div>

        <div className="mr-2 flex shrink-0 items-center">
          <Button
            onClick={onNewCancellation}
            className="h-9 rounded-xl bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] px-3 text-sm font-medium text-white shadow-[0_8px_20px_rgba(37,99,235,0.35)] transition-all hover:shadow-[0_10px_24px_rgba(37,99,235,0.45)] lg:h-10 lg:px-4 xl:h-10 xl:px-4 xl2:h-11 xl2:px-5"
          >
            <Plus className="mr-2 h-4 w-4" />
            Hueco disponible
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden pt-2 lg:pt-3 xl:pt-3 xl2:pt-6">
        <div className="grid h-full min-h-0 grid-cols-[220px_minmax(0,1fr)_240px] gap-3 lg:grid-cols-[240px_minmax(0,1fr)_250px] lg:gap-4 xl:grid-cols-[260px_minmax(0,1fr)_270px] xl:gap-5 xl2:grid-cols-[340px_minmax(0,1fr)_300px] xl2:gap-6">
          <StandardCard
            header={waitlistHeader}
            className="h-full min-h-0 overflow-hidden"
          >
            <WaitlistCard
              companyId={effectiveCompanyId}
              locationId={effectiveLocationId}
              refreshKey={refreshKey}
              onHeaderChange={setWaitlistHeader}
            />
          </StandardCard>

          <StandardCard
            header={slotsListHeader}
            className="flex min-h-0 flex-col overflow-hidden"
          >
            <SlotsListCard
              locationId={effectiveLocationId}
              onSlotClick={(day, slot, services) => {
                onSlotClick(day, slot, services, effectiveLocationId);
              }}
              refreshKey={refreshKey}
              onHeaderChange={setSlotsListHeader}
            />
          </StandardCard>

          <div className="flex min-h-0 flex-col gap-3 overflow-hidden lg:gap-4 xl:gap-5 xl2:gap-6">
            <StandardCard
              header={activityHeader}
              className="min-h-0 flex-1 overflow-hidden"
            >
              <SlotsActivityFeedCard
                locationId={effectiveLocationId}
                onHeaderChange={setActivityHeader}
              />
            </StandardCard>
          </div>
        </div>
      </div>
    </div>
  );
}