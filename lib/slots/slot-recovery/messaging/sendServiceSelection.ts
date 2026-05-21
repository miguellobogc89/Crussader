// lib/slots/slot-recovery/messaging/sendServiceSelection.ts

import { slotRecoveryTexts } from "./slotRecoveryMessageTexts";

const WHATSAPP_TOKEN = process.env.WHATSAPP_PERMANENT_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

type ServiceOption = {
  id: string;
  title: string;
  description?: string;
};

type SendServiceSelectionParams = {
  to: string;
  options: ServiceOption[];
};

function toWhatsAppButtonTitle(value: string): string {
  const cleanValue = value.trim();

  if (cleanValue.length <= 20) {
    return cleanValue;
  }

  return cleanValue.slice(0, 20).trim();
}

function toWhatsAppRowTitle(value: string): string {
  const cleanValue = value.trim();

  if (cleanValue.length <= 24) {
    return cleanValue;
  }

  return cleanValue.slice(0, 24).trim();
}

export async function sendServiceSelection({
  to,
  options,
}: SendServiceSelectionParams) {
  const url = `https://graph.facebook.com/v23.0/${PHONE_NUMBER_ID}/messages`;

  let payload: Record<string, unknown>;

  if (false) {
    payload = {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: {
          text: slotRecoveryTexts.serviceSelection.body,
        },
        action: {
          buttons: options.map((option) => {
            return {
              type: "reply",
              reply: {
                id: option.id,
                title: toWhatsAppButtonTitle(option.title),
              },
            };
          }),
        },
      },
    };
  } else {
    payload = {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "list",
        body: {
          text: slotRecoveryTexts.serviceSelection.body,
        },
        action: {
          button: slotRecoveryTexts.serviceSelection.button,
          sections: [
            {
              title: "Servicios disponibles",
              rows: options.map((option) => {
                return {
                  id: option.id,
                  title: toWhatsAppRowTitle(option.title),
                  description: (option.description ?? "").slice(0, 72),
                };
              }),
            },
          ],
        },
      },
    };
  }


  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

if (!res.ok) {
  console.error("[WA][SERVICE_SELECTION][ERROR][STATUS]", res.status);
  console.error(
    "[WA][SERVICE_SELECTION][ERROR][BODY]",
    JSON.stringify(data, null, 2),
  );

  throw new Error(
    typeof data?.error?.message === "string"
      ? data.error.message
      : "whatsapp_service_selection_send_failed",
  );
}

  return data;
}