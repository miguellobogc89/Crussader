// app/components/slots/GapManagement/GapWhatsAppPreview.tsx

"use client";

import { MessageSquare } from "lucide-react";
import type { SelectedServiceItem } from "@/app/components/slots/slots.types";

type Promotion = "none" | "10" | "25";

type GapWhatsAppPreviewProps = {
  services: SelectedServiceItem[];
  promotion: Promotion;
  day: string;
  timeStart: string;
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

function buildWhatsAppMessage(
  services: SelectedServiceItem[],
  promotion: Promotion,
  day: string,
  timeStart: string,
) {
  const header =
    `¡Hola! 👋\n\n` +
    `Se ha liberado un hueco el *${day}* a las *${timeStart}*.\n` +
    `Aprovecha esta oportunidad:\n`;

  const lines = services
    .map((service) => {
      const finalPrice = getDiscountedPrice(service.price, promotion);

      if (promotion === "none") {
        return `▸ ${service.serviceName} — ${service.price}€`;
      }

      return `▸ ${service.serviceName} — ${finalPrice}€`;
    })
    .join("\n");

  const footer =
    `\n\nElige el que más te interese y reserva antes de que se agote. ` +
    `¡Plazas muy limitadas! ⏳`;

  return `${header}\n${lines}${footer}`;
}

export function GapWhatsAppPreview({
  services,
  promotion,
  day,
  timeStart,
}: GapWhatsAppPreviewProps) {
  const message = buildWhatsAppMessage(services, promotion, day, timeStart);

  return (
    <div className="space-y-2.5">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <MessageSquare className="h-3 w-3" />
        Vista previa WhatsApp
      </p>

      <div className="rounded-2xl border border-[#c6e6be] bg-[#e7f8e2] p-4 shadow-sm">
        <div className="whitespace-pre-line text-[13px] leading-relaxed text-gray-800">
          {message}
        </div>

        <div className="mt-3 border-t border-[#c6e6be] pt-2.5">
          <button
            type="button"
            className="w-full py-1.5 text-center text-[13px] font-semibold text-[#128C7E]"
          >
            📅 Reservar ahora
          </button>
        </div>

        <p className="mt-2 text-right text-[10px] tabular-nums text-gray-500">
          14:32 ✓✓
        </p>
      </div>
    </div>
  );
}