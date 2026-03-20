// app/dashboard/slots/page.tsx

"use client";

import { useState } from "react";
import PageShell from "@/app/components/layouts/PageShell";
import { SlotsGapManagementPanel } from "@/app/components/slots/GapManagement/SlotsGapManagementPanel";
import { SlotsNewCancellationModal } from "@/app/components/slots/SlotsNewCancellationModal";
import { SlotsInviteModal } from "@/app/components/slots/SlotsInviteModal";
import { SlotsPageShell } from "@/app/components/slots/SlotsPageShell";
import type {
  SlotItem,
  SelectedServiceItem,
} from "@/app/components/slots/slots.types";

export default function SlotsPage() {
  const [selectedSlot, setSelectedSlot] = useState<{
    day: string;
    slot: SlotItem;
    services: SelectedServiceItem[];
  } | null>(null);

  const [showNewCancellation, setShowNewCancellation] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  return (
    <PageShell
      title="Huecos"
      description="Recupera citas canceladas automáticamente con WhatsApp."
    >
      <SlotsPageShell
        onNewCancellation={() => setShowNewCancellation(true)}
        onInvite={() => setShowInvite(true)}
        onSlotClick={(day, slot, services) => {
          setSelectedSlot({ day, slot, services });
        }}
      />

      <SlotsGapManagementPanel
        open={selectedSlot !== null}
        onClose={() => setSelectedSlot(null)}
        day={selectedSlot?.day || ""}
        slot={selectedSlot?.slot || null}
        services={selectedSlot?.services || []}
      />

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