// lib/whatsapp/sendServiceSelection.ts
const WHATSAPP_TOKEN = process.env.WHATSAPP_PERMANENT_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

type ServiceOption = {
  id: string;
  title: string;
  description?: string;
};

type SendServiceSelectionParams = {
  to: string;
  bodyText: string;
  buttonText?: string;
  options: ServiceOption[];
};

export async function sendServiceSelection({
  to,
  bodyText,
  buttonText = "Ver servicios",
  options,
}: SendServiceSelectionParams) {
  const url = `https://graph.facebook.com/v23.0/${PHONE_NUMBER_ID}/messages`;

  let payload: Record<string, unknown>;

  if (options.length <= 3) {
    payload = {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: {
          text: bodyText,
        },
        action: {
          buttons: options.map((option) => {
            return {
              type: "reply",
              reply: {
                id: option.id,
                title: option.title,
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
          text: bodyText,
        },
        action: {
          button: buttonText,
          sections: [
            {
              title: "Servicios disponibles",
              rows: options.map((option) => {
                return {
                  id: option.id,
                  title: option.title,
                  description: option.description ?? "",
                };
              }),
            },
          ],
        },
      },
    };
  }

  console.log("[WA][SERVICE_SELECTION][PAYLOAD]", JSON.stringify(payload, null, 2));

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  console.log("[WA][SERVICE_SELECTION][RESPONSE]", data);

  if (!res.ok) {
    throw new Error(
      typeof data?.error?.message === "string"
        ? data.error.message
        : "whatsapp_service_selection_send_failed"
    );
  }

  return data;
}