// lib/slots/slot-recovery/messaging/sendSlotRecoveryConfirmation.ts

import { sendTextMessage } from "@/lib/whatsapp/sendTextMessage";
import { slotRecoveryTexts } from "./slotRecoveryMessageTexts";

type Params = {
  to: string;
  serviceName: string;
  startAt: Date;
  locationName: string;
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

  await sendTextMessage({
    to: params.to,
    text,
  });
}