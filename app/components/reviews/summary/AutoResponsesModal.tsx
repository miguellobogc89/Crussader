// app/components/reviews/summary/AutoResponsesModal.tsx
"use client";

import * as React from "react";
import AnimatedDialog from "@/app/components/crussader/AnimatedDialog";
import AutoPublishSettingsPanel from "@/app/components/reviews/summary/AutoPublishSettingsPanel";

export default function AutoResponsesModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <AnimatedDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Respuestas automáticas"
      contentClassName="sm:max-w-3xl"
    >
      <AutoPublishSettingsPanel />
    </AnimatedDialog>
  );
}

