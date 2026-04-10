// app/dashboard/slots/page.tsx

"use client";

import { useEffect, useState } from "react";
import { Inter } from "next/font/google";
import PageShellNoScroll from "@/app/components/layouts/PageShellNoScroll";
import { SlotsGapManagementPanel } from "@/app/components/slots/GapManagement/SlotsGapManagementPanel";
import { SlotsGapControlPanel } from "@/app/components/slots/GapManagement/SlotsGapControlPanel";
import { NewCancellationModal } from "@/app/components/slots/NewAvailableSlotModal/NewCancellationModal";
import { SlotsInviteModal } from "@/app/components/slots/SlotsInviteModal";
import { SlotsPageShell } from "@/app/components/slots/SlotsPageShell";
import type {
  SlotItem,
  SelectedServiceItem,
} from "@/app/components/slots/slots.types";

const inter = Inter({
  subsets: ["latin"],
});

type SlotTemplateData = {
  template_name: string;
  language: string;
  body_preview: string | null;
};

type SlotsPageContentProps = {
  bootstrapCompanyId: string | null;
  bootstrapLocationId: string | null;
  companyName?: string | null;
};

function SlotsPageContent({
  bootstrapCompanyId,
  bootstrapLocationId,
  companyName,
}: SlotsPageContentProps) {
  console.log("[SlotsPage render-prop]", {
    bootstrapCompanyId,
    bootstrapLocationId,
    companyName,
  });

  const [companyId, setCompanyId] = useState<string | null>(null);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{
    day: string;
    slot: SlotItem;
    services: SelectedServiceItem[];
    locationId: string | null;
  } | null>(null);

  const [slotTemplate, setSlotTemplate] = useState<SlotTemplateData | null>(null);
  const [showNewCancellation, setShowNewCancellation] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const effectiveCompanyId = companyId ?? bootstrapCompanyId ?? null;
  const effectiveLocationId = locationId ?? bootstrapLocationId ?? null;

  const shouldOpenManagementPanel =
    selectedSlot?.slot.status === "pending" ||
    selectedSlot?.slot.status === "fresh";

  useEffect(() => {
    if (!effectiveCompanyId || !selectedSlot || !shouldOpenManagementPanel) {
      setSlotTemplate(null);
      return;
    }

    const safeCompanyId: string = effectiveCompanyId;
    const controller = new AbortController();

    async function fetchTemplate() {
      try {
        const response = await fetch(
          `/api/slots/template?companyId=${encodeURIComponent(
            safeCompanyId,
          )}`,
          {
            method: "GET",
            signal: controller.signal,
            cache: "no-store",
          },
        );

        const data = await response.json();

        if (!response.ok || !data?.ok) {
          setSlotTemplate(null);
          return;
        }

        setSlotTemplate(data.template ?? null);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }

        console.error("slots_template_fetch_error", error);
        setSlotTemplate(null);
      }
    }

    void fetchTemplate();

    return () => controller.abort();
  }, [effectiveCompanyId, selectedSlot, shouldOpenManagementPanel]);

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <SlotsPageShell
          companyId={effectiveCompanyId}
          locationId={effectiveLocationId}
          onCompanyChange={setCompanyId}
          onLocationChange={setLocationId}
          onNewCancellation={() => setShowNewCancellation(true)}
          onInvite={() => setShowInvite(true)}
          onSlotClick={(day, slot, services, slotLocationId) => {
            setSelectedSlot({
              day,
              slot,
              services,
              locationId: slotLocationId,
            });
          }}
          refreshKey={refreshKey}
        />
      </div>

      {effectiveCompanyId && selectedSlot && shouldOpenManagementPanel ? (
        <SlotsGapManagementPanel
          open={true}
          onClose={() => setSelectedSlot(null)}
          day={selectedSlot.day}
          slot={selectedSlot.slot}
          services={selectedSlot.services}
          companyId={effectiveCompanyId}
          locationId={selectedSlot.locationId ?? ""}
          templateBody={slotTemplate?.body_preview ?? ""}
          companyName={companyName ?? ""}
          onSent={() => setRefreshKey((prev) => prev + 1)}
          onServicesSaved={() => setRefreshKey((prev) => prev + 1)}
        />
      ) : null}

      {selectedSlot && !shouldOpenManagementPanel ? (
        <SlotsGapControlPanel
          open={true}
          onClose={() => setSelectedSlot(null)}
          slot={selectedSlot.slot}
        />
      ) : null}

      <NewCancellationModal
        open={showNewCancellation}
        onClose={() => setShowNewCancellation(false)}
        locationId={effectiveLocationId ?? ""}
      />

      <SlotsInviteModal
        open={showInvite}
        onClose={() => setShowInvite(false)}
      />
    </>
  );
}

export default function SlotsPage() {
  return (
    <div className={inter.className}>
      <PageShellNoScroll
        title="Gestión de huecos disponibles"
        description="Recupera citas canceladas automáticamente con WhatsApp."
      >
        {({ bootstrapCompanyId, bootstrapLocationId, companyName }) => (
          <SlotsPageContent
            bootstrapCompanyId={bootstrapCompanyId ?? null}
            bootstrapLocationId={bootstrapLocationId ?? null}
            companyName={companyName ?? null}
          />
        )}
      </PageShellNoScroll>
    </div>
  );
}