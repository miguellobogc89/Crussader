// app/components/slots/GapManagement/GapDeliveryOptions.tsx

"use client";

import { Slider } from "@/app/components/ui/slider";
import { Switch } from "@/app/components/ui/switch";

type GapDeliveryOptionsProps = {
  clientCount: number[];
  onClientCountChange: (value: number[]) => void;
  subscribedOnly: boolean;
  onSubscribedOnlyChange: (checked: boolean) => void;
};

export function GapDeliveryOptions({
  clientCount,
  onClientCountChange,
  subscribedOnly,
  onSubscribedOnlyChange,
}: GapDeliveryOptionsProps) {
  return (
    <>
      <div className="space-y-2.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Envío a clientes
        </p>

        <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Clientes a avisar
            </span>
            <span className="text-sm font-bold tabular-nums text-primary">
              {clientCount[0]}
            </span>
          </div>

          <Slider
            value={clientCount}
            onValueChange={onClientCountChange}
            min={10}
            max={100}
            step={10}
            className="[&_[role=slider]]:border-primary [&_[role=slider]]:bg-primary [&_.relative>div]:bg-primary"
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-4">
        <div>
          <p className="text-sm font-medium text-foreground">
            Solo clientes suscritos
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Enviar solo a quienes aceptaron alertas
          </p>
        </div>

        <Switch
          checked={subscribedOnly}
          onCheckedChange={onSubscribedOnlyChange}
        />
      </div>
    </>
  );
}