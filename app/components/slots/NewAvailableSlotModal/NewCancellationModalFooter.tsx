// app/components/slots/NewAvailableSlotModal/NewCancellationModalFooter.tsx
"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";

type NewCancellationModalFooterProps = {
  isSubmitting: boolean;
  created: boolean;
  disabled: boolean;
  onSubmit: () => void;
};

export function NewCancellationModalFooter({
  isSubmitting,
  created,
  disabled,
  onSubmit,
}: NewCancellationModalFooterProps) {
  return (
    <div className="p-6 pt-0">
      <Button
        onClick={onSubmit}
        disabled={disabled}
        className="h-11 w-full rounded-xl bg-primary font-medium text-primary-foreground shadow-primary-glow transition-all duration-150 hover:bg-primary/90"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creando hueco...
          </>
        ) : null}

        {!isSubmitting && !created ? "Crear hueco" : null}
        {!isSubmitting && created ? "✓ Hueco creado" : null}
      </Button>
    </div>
  );
}