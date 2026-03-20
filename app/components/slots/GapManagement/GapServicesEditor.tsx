// app/components/slots/GapManagement/GapServicesEditor.tsx

"use client";

import { Droplets, Scissors, Sparkles } from "lucide-react";
import type { SelectedServiceItem } from "@/app/components/slots/slots.types";

type Promotion = "none" | "10" | "25";

type GapServicesEditorProps = {
  services: SelectedServiceItem[];
  promotion: Promotion;
  onAdd?: () => void;
};

function getDiscountedPrice(price: number, promo: Promotion): number {
  if (promo === "10") {
    return Math.round(price * 0.9);
  }

  if (promo === "25") {
    return Math.round(price * 0.75);
  }

  return price;
}

function getServiceIcon(serviceName: string) {
  const normalized = serviceName.toLowerCase();

  if (normalized.includes("hidrat")) {
    return Droplets;
  }

  if (normalized.includes("corte")) {
    return Scissors;
  }

  if (normalized.includes("barba")) {
    return Scissors;
  }

  if (normalized.includes("peinado")) {
    return Scissors;
  }

  return Sparkles;
}

export function GapServicesEditor({
  services,
  promotion,
  onAdd,
}: GapServicesEditorProps) {
  return (
    <div className="space-y-2.5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Servicios ofertados
      </p>

      <div className="flex flex-wrap gap-2">
        {services.map((service) => {
          const Icon = getServiceIcon(service.serviceName);
          const finalPrice = getDiscountedPrice(service.price, promotion);

          return (
            <div
              key={service.serviceId}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-muted/50 px-3 py-2 text-sm font-medium text-foreground"
            >
              <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span>{service.serviceName}</span>
              <span className="ml-1 tabular-nums text-muted-foreground">
                {finalPrice}€
              </span>
            </div>
          );
        })}

        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 rounded-xl border-2 border-dashed border-primary/30 px-3 py-2 text-sm font-medium text-primary transition-colors hover:border-primary/50 hover:bg-primary/5 active:scale-95"
        >
          <span className="text-base leading-none">＋</span>
          Añadir
        </button>
      </div>
    </div>
  );
}