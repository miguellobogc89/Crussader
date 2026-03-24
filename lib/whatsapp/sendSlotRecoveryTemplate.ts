// lib/whatsapp/sendSlotRecoveryTemplate.ts

export async function sendSlotRecoveryTemplate(args: {
  to: string;
  templateName: string;
  language: string;
  components: any[];
}) {
  const token = process.env.WHATSAPP_PERMANENT_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    throw new Error("Missing WhatsApp config");
  }

  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to: args.to,
    type: "template",
    template: {
      name: args.templateName,
      language: {
        code: args.language,
      },
      components: args.components,
    },
  };

  console.log("[WA][SEND][PAYLOAD]", JSON.stringify(payload, null, 2));

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

if (!response.ok) {
  console.error("[WA][SEND][ERROR][STATUS]", response.status);
  console.error("[WA][SEND][ERROR][BODY]", JSON.stringify(data, null, 2));

  throw new Error(
    typeof data?.error?.message === "string"
      ? data.error.message
      : "WhatsApp send failed"
  );
}

  return data;
}