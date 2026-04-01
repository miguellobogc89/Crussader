// app/components/slots/SlotsPageShell.tsx
"use client";

import { Plus } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import LocationSelector from "@/app/components/crussader/LocationSelector";
import { SlotsStatsCard } from "./SlotsStatsCard";
import { SlotsListCard } from "./AvailableSlotsList";
import { ConfigurationCard } from "./configuration/ConfigurationCard";
import { SlotsActivityFeedCard } from "./SlotsActivityFeedCard";
import type { SlotItem, SelectedServiceItem } from "./slots.types";
import { WaitlistCard } from "./Waitlist/WaitlistCard";
import StandardCard from "@/app/components/crussader/UX/standardCard";

type SlotsPageShellProps = {
  companyId: string | null;
  locationId: string | null;
  onCompanyChange: (companyId: string | null) => void;
  onLocationChange: (locationId: string | null) => void;
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
  onCompanyChange,
  onLocationChange,
  onNewCancellation,
  onInvite,
  onSlotClick,
  refreshKey,
}: SlotsPageShellProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <StandardCard className="px-4 py-4 pr-6">
          <div className="flex items-stretch justify-between gap-6">
            <div className="min-w-0 flex-1 space-y-4">
              <div className="min-w-0 max-w-[320px] empty:hidden">
                <LocationSelector
                  onSelect={(id, location) => {
                    onLocationChange(id ?? null);
                    onCompanyChange(location?.companyId ?? null);
                  }}
                />
              </div>

              <div>
                <SlotsStatsCard
                  companyId={companyId ?? ""}
                  locationId={locationId}
                />
              </div>
            </div>

            <div className="flex shrink-0 items-center">
              <Button
                onClick={onNewCancellation}
                className="h-11 rounded-xl px-5 font-medium shadow-primary-glow"
              >
                <Plus className="mr-2 h-4 w-4" />
                Hueco disponible
              </Button>
            </div>
          </div>
        </StandardCard>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[340px_minmax(0,1fr)_300px]">
          <StandardCard>
            <div className="h-full">
              <WaitlistCard
                companyId={companyId}
                locationId={locationId}
                refreshKey={refreshKey}
              />
            </div>
          </StandardCard>

          <StandardCard>
            <div className="space-y-6">
              <SlotsListCard
                locationId={locationId}
                onSlotClick={(day, slot, services) => {
                  onSlotClick(day, slot, services, locationId);
                }}
                refreshKey={refreshKey}
              />
            </div>
          </StandardCard>

          <div className="space-y-6">
            <ConfigurationCard locationId={locationId} />
            <SlotsActivityFeedCard locationId={locationId} />
          </div>
        </div>
      </div>
    </div>
  );
}