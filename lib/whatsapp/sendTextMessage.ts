// lib/whatsapp/sendTextMessage.ts

const WHATSAPP_TOKEN = process.env.WHATSAPP_PERMANENT_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

type SendTextMessageParams = {
  to: string;
  text: string;
};

export async function sendTextMessage({ to, text }: SendTextMessageParams) {
  if (!WHATSAPP_TOKEN) {
    throw new Error("Missing WHATSAPP_PERMANENT_TOKEN");
  }

  if (!PHONE_NUMBER_ID) {
    throw new Error("Missing WHATSAPP_PHONE_NUMBER_ID");
  }

  const cleanTo = to.trim();
  const cleanText = text.trim();

  if (!cleanTo || !cleanText) {
    throw new Error("Missing WhatsApp recipient or text");
  }

  const url = `https://graph.facebook.com/v23.0/${PHONE_NUMBER_ID}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to: cleanTo,
    type: "text",
    text: {
      body: cleanText,
    },
  };

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
    let message = "whatsapp_text_send_failed";

    if (typeof data?.error?.message === "string") {
      message = data.error.message;
    }

    throw new Error(message);
  }

  return data;
}