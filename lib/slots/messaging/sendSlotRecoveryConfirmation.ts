// lib/slots/slot-recovery/messaging/sendSlotRecoveryConfirmation.ts

import { slotRecoveryTexts } from "./slotRecoveryMessageTexts";

import { sendAndLogWhatsappMessage } from "@/lib/whatsapp/outbound/sendAndLogWhatsappMessage";

type Params = {
  to: string;
  serviceName?: string | null;
  startAt: Date;
  locationName: string;
  conversationId?: string | null;
};

export async function sendSlotRecoveryConfirmation(params: Params) {
  const date = new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(params.startAt);

  const time = new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    hour: "2-digit",
    minute: "2-digit",
  }).format(params.startAt);

  const text = slotRecoveryTexts.confirmation.build({
    serviceName: params.serviceName,
    date,
    time,
    locationName: params.locationName,
  });

if (!params.conversationId) {
  return;
}

await sendAndLogWhatsappMessage({
  to: params.to,
  text,
  conversationId: params.conversationId,
});

  await sendAndLogWhatsappMessage({
    to: params.to,
    text,
    conversationId: params.conversationId,
  });
}