// lib/whatsapp/sendTextMessage.ts

const WHATSAPP_TOKEN = process.env.WHATSAPP_PERMANENT_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

type SendTextMessageParams = {
  to: string;
  text: string;
};

export async function sendTextMessage({
  to,
  text,
}: SendTextMessageParams) {
  const url = `https://graph.facebook.com/v23.0/${PHONE_NUMBER_ID}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: {
      body: text,
    },
  };

  console.log("[WA][TEXT][PAYLOAD]", JSON.stringify(payload, null, 2));

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  console.log("[WA][TEXT][RESPONSE]", data);

  if (!res.ok) {
    throw new Error(
      typeof data?.error?.message === "string"
        ? data.error.message
        : "whatsapp_text_send_failed",
    );
  }

  return data;
}