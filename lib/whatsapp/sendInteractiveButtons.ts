// lib/whatsapp/sendInteractiveButtons.ts

const WHATSAPP_TOKEN = process.env.WHATSAPP_PERMANENT_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

type Button = {
  id: string;
  title: string;
};

type SendInteractiveButtonsParams = {
  to: string;
  bodyText: string;
  buttons: Button[];
};

export async function sendInteractiveButtons({
  to,
  bodyText,
  buttons,
}: SendInteractiveButtonsParams) {
  const url = `https://graph.facebook.com/v23.0/${PHONE_NUMBER_ID}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: {
        text: bodyText,
      },
      action: {
        buttons: buttons.map((b) => ({
          type: "reply",
          reply: {
            id: b.id,
            title: b.title,
          },
        })),
      },
    },
  };

  console.log("[WA][INTERACTIVE][PAYLOAD]", JSON.stringify(payload, null, 2));

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  console.log("[WA][INTERACTIVE][RESPONSE]", data);

  if (!res.ok) {
    throw new Error("whatsapp_interactive_send_failed");
  }

  return data;
}