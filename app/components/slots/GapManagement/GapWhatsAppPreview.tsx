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
  templateBody: string;
  companyName: string;
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

function formatReadableDate(day: string, timeStart: string): string {
  const date = new Date(day);

  if (Number.isNaN(date.getTime())) {
    return `${day} a las ${timeStart}`;
  }

  const formattedDay = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);

  return `${formattedDay} a las ${timeStart}`;
}

function resolveServicesBlock(
  services: SelectedServiceItem[],
  promotion: Promotion,
): { servicesText: string; firstPriceText: string } {
  if (!Array.isArray(services) || services.length === 0) {
    return {
      servicesText: "tu cita",
      firstPriceText: "",
    };
  }

  const lines: string[] = [];

  for (const service of services) {
    const finalPrice = getDiscountedPrice(service.price, promotion);
    lines.push(`- ${service.serviceName} ${finalPrice}€`);
  }

  const firstService = services[0];
  const firstPrice = getDiscountedPrice(firstService.price, promotion);

  return {
    servicesText: `uno de estos servicios a elegir:\n${lines.join("\n")}`,
    firstPriceText: `${firstPrice}€`,
  };
}

function renderTemplate(
  templateBody: string,
  services: SelectedServiceItem[],
  promotion: Promotion,
  day: string,
  timeStart: string,
  companyName: string,
): string {
  const template = templateBody.trim();

  if (!template) {
    return "No hay plantilla disponible para este hueco.";
  }

  const servicesBlock = resolveServicesBlock(services, promotion);

  const readableDate = formatReadableDate(day, timeStart);

  let message = template;

  message = message.replace(/\{\{1\}\}/g, "Cliente");
  message = message.replace(/\{\{2\}\}/g, companyName);
  message = message.replace(/\{\{3\}\}/g, servicesBlock.servicesText);
  message = message.replace(/\{\{4\}\}/g, `\nel ${readableDate}\n`);
  message = message.replace(/\{\{5\}\}/g, servicesBlock.firstPriceText);

  return message;
}

export function GapWhatsAppPreview({
  services,
  promotion,
  day,
  timeStart,
  templateBody,
  companyName,
}: GapWhatsAppPreviewProps) {
const message = renderTemplate(
  templateBody,
  services,
  promotion,
  day,
  timeStart,
  companyName,
);

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
            Reservar ahora
          </button>
        </div>

        <p className="mt-2 text-right text-[10px] tabular-nums text-gray-500">
          Vista previa de plantilla
        </p>
      </div>
    </div>
  );
}