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
  specialistName: string;
};

function getWhatsAppDayText(value: string): string {
  const parsed = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const tomorrowDate = new Date(todayDate);
  tomorrowDate.setDate(todayDate.getDate() + 1);

  const weekday = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
  }).format(parsed);

  const dayNumber = new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
  }).format(parsed);

  const monthNumber = new Intl.DateTimeFormat("es-ES", {
    month: "2-digit",
  }).format(parsed);

  const baseText = `${weekday}, ${dayNumber}/${monthNumber}`;

  if (parsed.getTime() === todayDate.getTime()) {
    return `hoy ${baseText}`;
  }

  if (parsed.getTime() === tomorrowDate.getTime()) {
    return `mañana ${baseText}`;
  }

  const startOfWeek = new Date(todayDate);
  startOfWeek.setDate(todayDate.getDate() - todayDate.getDay() + 1);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  if (parsed >= startOfWeek && parsed <= endOfWeek) {
    return `este ${baseText}`;
  }

  return `el ${baseText}`;
}

function renderWhatsAppText(text: string) {
  const parts = text.split(/(\*[^*]+\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <strong key={index} className="font-semibold">
          {part.slice(1, -1)}
        </strong>
      );
    }

    return <span key={index}>{part}</span>;
  });
}

function renderTemplate(
  templateBody: string,
  day: string,
  timeStart: string,
  companyName: string,
  specialistName: string
): string {
  const template = templateBody.trim();

  if (!template) {
    return "No hay plantilla disponible para este hueco.";
  }

  let message = template;

  message = message.replace(/\{\{1\}\}/g, "Carlos");
  message = message.replace(/\{\{2\}\}/g, companyName);
  message = message.replace(/\{\{3\}\}/g, getWhatsAppDayText(day));
  message = message.replace(/\{\{4\}\}/g, timeStart);
  message = message.replace(/\{\{5\}\}/g, specialistName);

  return message;
}

export function GapWhatsAppPreview({
  day,
  timeStart,
  templateBody,
  companyName,
  specialistName,
}: GapWhatsAppPreviewProps) {
  const message = renderTemplate(
    templateBody,
    day,
    timeStart,
    companyName,
    specialistName
  );

  return (
    <div className="space-y-2.5">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <MessageSquare className="h-3 w-3" />
        Vista previa WhatsApp
      </p>

      <div className="rounded-2xl border border-[#c6e6be] bg-[#e7f8e2] p-4 shadow-sm">
        <div className="whitespace-pre-line text-[13px] leading-relaxed text-gray-800">
          {renderWhatsAppText(message)}
        </div>

        <div className="mt-3 border-t border-[#c6e6be] pt-2.5">
          <button
            type="button"
            className="w-full py-1.5 text-center text-[13px] font-semibold text-[#128C7E]"
          >
            Reservar ahora
          </button>
        </div>
      </div>
    </div>
  );
}