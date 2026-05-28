// lib/slots/slot-recovery/messaging/sendSlotAlreadyTakenMessage.ts

import { sendTextMessage } from "@/lib/whatsapp/sendTextMessage";
import { slotRecoveryTexts } from "./slotRecoveryMessageTexts";

type Params = {
  to: string;
};

export async function sendSlotAlreadyTakenMessage(params: Params) {
  await sendTextMessage({
    to: params.to,
    text: slotRecoveryTexts.slotAlreadyTaken.text,
  });
}