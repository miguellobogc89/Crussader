"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import StandardCard from "@/app/components/crussader/UX/standardCard";
import LocationSelector from "@/app/components/crussader/LocationSelector";
import { SlotsStatsCard } from "./SlotsStatsCard";
import { SlotsListCard } from "./SlotsListCard";
import { SlotsInterestedClientsCard } from "./SlotsInterestedClientsCard";
import { SlotsActivityFeedCard } from "./SlotsActivityFeedCard";
import type { SlotItem, SelectedServiceItem } from "./slots.types";

type SlotsPageShellProps = {
  onNewCancellation: () => void;
  onInvite: () => void;
  onSlotClick: (
    day: string,
    slot: SlotItem,
    services: SelectedServiceItem[],
    locationId: string | null,
  ) => void;
  onCompanyChange?: (companyId: string | null) => void;
  refreshKey?: number;
};

export function SlotsPageShell({
  onNewCancellation,
  onInvite,
  onSlotClick,
  onCompanyChange,
  refreshKey,
}: SlotsPageShellProps) {
  const [locationId, setLocationId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <StandardCard className="px-4 py-3">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 flex-1 max-w-[320px]">
            <div className="mt-2">
              <LocationSelector
                onSelect={(id, location) => {
                  setLocationId(id ?? null);
                  setCompanyId(location?.companyId ?? null);
                  onCompanyChange?.(location?.companyId ?? null);
                }}
              />
            </div>
          </div>

          <Button
            onClick={onNewCancellation}
            className="h-11 rounded-xl px-5 font-medium shadow-primary-glow"
          >
            <Plus className="mr-2 h-4 w-4" />
            Hueco disponible
          </Button>
        </div>

        <div className="px-3 py-3">
          <SlotsStatsCard
            companyId={companyId ?? ""}
            locationId={locationId}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            <SlotsListCard
              locationId={locationId}
              onSlotClick={(day, slot, services) => {
                onSlotClick(day, slot, services, locationId);
              }}
              refreshKey={refreshKey}
            />
          </div>

          <div className="space-y-6">
            <SlotsInterestedClientsCard onInvite={onInvite} />
            <SlotsActivityFeedCard locationId={locationId} />
          </div>
        </div>
      </StandardCard>
    </div>
  );
}