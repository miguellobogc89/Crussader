// app/components/slots/SlotsPageShell.tsx
"use client";

import { Plus } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { SlotsStatsCard } from "./SlotsStatsCard";
import { SlotsListCard } from "./AvailableSlotsList";
import { ConfigurationCard } from "./configuration/ConfigurationCard";
import { SlotsActivityFeedCard } from "./SlotsActivityFeedCard";
import type { SlotItem, SelectedServiceItem } from "./slots.types";
import { WaitlistCard } from "./Waitlist/WaitlistCard";
import StandardCard from "@/app/components/crussader/UX/standardCard";
import {
  useActiveLocation,
  useActiveLocationId,
  useBootstrapData,
} from "@/app/providers/bootstrap-store";

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
  onNewCancellation,
  onSlotClick,
  refreshKey,
}: SlotsPageShellProps) {
  const bootstrapData = useBootstrapData();
  const activeLocationId = useActiveLocationId();
  const activeLocation = useActiveLocation();

  let effectiveLocationId = locationId;
  if (!effectiveLocationId) {
    effectiveLocationId = activeLocationId;
  }

  let effectiveCompanyId = companyId;
  if (!effectiveCompanyId && activeLocation?.companyId) {
    effectiveCompanyId = activeLocation.companyId;
  }
  if (!effectiveCompanyId && bootstrapData?.activeCompanyResolved?.id) {
    effectiveCompanyId = bootstrapData.activeCompanyResolved.id;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-6">
      <StandardCard className="flex min-h-0 flex-1 flex-col overflow-hidden p-6">
        <div className="flex shrink-0 items-center justify-between gap-6">
          <div className="min-w-0 flex-1">
            <SlotsStatsCard
              companyId={effectiveCompanyId || ""}
              locationId={effectiveLocationId}
            />
          </div>

          <div className="mr-2 flex shrink-0 items-center">
            <Button
              onClick={onNewCancellation}
              className="h-11 rounded-xl bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] px-5 font-medium text-white shadow-[0_8px_20px_rgba(37,99,235,0.35)] transition-all hover:shadow-[0_10px_24px_rgba(37,99,235,0.45)]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Hueco disponible
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden pt-6">
          <div className="grid h-full min-h-0 grid-cols-1 gap-6 xl:grid-cols-[340px_minmax(0,1fr)_300px]">
            <StandardCard className="h-full min-h-0 overflow-hidden">
              <div className="h-full min-h-0 overflow-hidden">
                <WaitlistCard
                  companyId={effectiveCompanyId}
                  locationId={effectiveLocationId}
                  refreshKey={refreshKey}
                />
              </div>
            </StandardCard>

            <div className="flex min-h-0 flex-col overflow-hidden">
              <SlotsListCard
                locationId={effectiveLocationId}
                onSlotClick={(day, slot, services) => {
                  onSlotClick(day, slot, services, effectiveLocationId);
                }}
                refreshKey={refreshKey}
              />
            </div>

            <div className="flex min-h-0 flex-col gap-6 overflow-hidden">
              <div className="shrink-0">
                <ConfigurationCard locationId={effectiveLocationId} />
              </div>

              <div className="min-h-0 flex-1 overflow-hidden">
                <SlotsActivityFeedCard locationId={effectiveLocationId} />
              </div>
            </div>
          </div>
        </div>
      </StandardCard>
    </div>
  );
}