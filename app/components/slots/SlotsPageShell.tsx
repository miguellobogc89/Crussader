// app/components/slots/SlotsPageShell.tsx
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import LocationSelector from "@/app/components/crussader/LocationSelector";
import { SlotsStatsCard } from "./SlotsStatsCard";
import { SlotsListCard } from "./SlotsListCard";
import { ConfigurationCard } from "./configuration/ConfigurationCard";
import { SlotsActivityFeedCard } from "./SlotsActivityFeedCard";
import type { SlotItem, SelectedServiceItem } from "./slots.types";
import { WaitlistCard } from "./Waitlist/WaitlistCard";
import StandardCard from "@/app/components/crussader/UX/standardCard";

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


    <div className="space-y-6">
<StandardCard className="px-4 py-4 pr-6">
  <div className="flex items-stretch justify-between gap-6">
    <div className="min-w-0 flex-1 space-y-4">
      <div className="min-w-0 max-w-[320px] empty:hidden">
        <LocationSelector
          onSelect={(id, location) => {
            setLocationId(id ?? null);
            setCompanyId(location?.companyId ?? null);
            onCompanyChange?.(location?.companyId ?? null);
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

    {/* MAIN PANEL */}
      <div className="space-y-6">

        {/* GRID */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[340px_minmax(0,1fr)_300px]">

          {/* LISTA DE ESPERA */}
          <StandardCard>
            <div className="h-full">
              <WaitlistCard
                locationId={locationId}
                refreshKey={refreshKey}
              />
            </div>
          </StandardCard>


          {/* HUECOS CREADOS */}
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

          {/* PANEL DERECHO */}
          <div className="space-y-6">
            <ConfigurationCard companyId={companyId} />
            <SlotsActivityFeedCard locationId={locationId} />
          </div>
        </div>
      </div>
  </div>
);
}