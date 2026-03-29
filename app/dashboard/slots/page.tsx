// app/dashboard/slots/page.tsx

"use client";

import { useEffect, useState } from "react";
import PageShell from "@/app/components/layouts/PageShell";
import { SlotsGapManagementPanel } from "@/app/components/slots/GapManagement/SlotsGapManagementPanel";
import { SlotsGapControlPanel } from "@/app/components/slots/GapManagement/SlotsGapControlPanel";
import { SlotsNewCancellationModal } from "@/app/components/slots/SlotsNewCancellationModal";
import { SlotsInviteModal } from "@/app/components/slots/SlotsInviteModal";
import { SlotsPageShell } from "@/app/components/slots/SlotsPageShell";
import { useBootstrapData } from "@/app/providers/bootstrap-store";
import type {
  SlotItem,
  SelectedServiceItem,
} from "@/app/components/slots/slots.types";

type SlotTemplateData = {
  template_name: string;
  language: string;
  body_preview: string | null;
};

export default function SlotsPage() {
  const [companyId, setCompanyId] = useState<string | null>(null);

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
  const boot = useBootstrapData();
  const companyName = boot?.activeCompanyResolved?.name ?? "tu negocio";

  const shouldOpenManagementPanel =
  selectedSlot?.slot.status === "pending" ||
  selectedSlot?.slot.status === "fresh";

  useEffect(() => {
    if (!companyId || !selectedSlot || !shouldOpenManagementPanel) {
      setSlotTemplate(null);
      return;
    }

    const controller = new AbortController();

    async function fetchTemplate() {
      try {
        const response = await fetch(
          `/api/slots/template?companyId=${encodeURIComponent(companyId ?? "")}`,
          {
            method: "GET",
            signal: controller.signal,
            cache: "no-store",
          }
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

    fetchTemplate();

    return () => controller.abort();
  }, [companyId, selectedSlot]);

  return (
    <PageShell
      title="Huecos"
      description="Recupera citas canceladas automáticamente con WhatsApp."
    >
<SlotsPageShell
  onNewCancellation={() => setShowNewCancellation(true)}
  onInvite={() => setShowInvite(true)}
  onCompanyChange={(id: string | null) => setCompanyId(id)}
  onSlotClick={(day, slot, services, locationId) => {
    setSelectedSlot({
      day,
      slot,
      services,
      locationId,
    });
  }}
  refreshKey={refreshKey}
/>

      {companyId && selectedSlot && shouldOpenManagementPanel ? (
<SlotsGapManagementPanel
  open={true}
  onClose={() => setSelectedSlot(null)}
  day={selectedSlot.day}
  slot={selectedSlot.slot}
  services={selectedSlot.services}
  companyId={companyId}
  locationId={selectedSlot.locationId ?? ""}
  templateBody={slotTemplate?.body_preview ?? ""}
  companyName={companyName}
  onSent={() => setRefreshKey((prev) => prev + 1)}
/>
      ) : null}

      {selectedSlot && !shouldOpenManagementPanel ? (
        <SlotsGapControlPanel
          open={true}
          onClose={() => setSelectedSlot(null)}
          slot={selectedSlot.slot}
        />
      ) : null}

      <SlotsNewCancellationModal
        open={showNewCancellation}
        onClose={() => setShowNewCancellation(false)}
      />

      <SlotsInviteModal
        open={showInvite}
        onClose={() => setShowInvite(false)}
      />
    </PageShell>
  );
}