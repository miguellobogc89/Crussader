// app/components/slots/NewAvailableSlotModal/NewCancellationModalHeader.tsx
"use client";

import { Clock, X } from "lucide-react";

type NewCancellationModalHeaderProps = {
  onClose: () => void;
};

export function NewCancellationModalHeader({
  onClose,
}: NewCancellationModalHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 p-6">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-muted">
          <Clock className="h-4 w-4 text-primary" />
        </div>

        <h2 className="text-base font-semibold tracking-tight text-foreground">
          Nuevo hueco disponible
        </h2>
      </div>

      <button
        onClick={onClose}
        className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-muted"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}