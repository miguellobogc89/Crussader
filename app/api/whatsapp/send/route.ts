import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { to } = await req.json();

    const toNorm = String(to ?? "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/^\+/, "")
    .replace(/^0+/, "");

    if (!process.env.WHATSAPP_TOKEN || !process.env.WHATSAPP_PHONE_ID) {
      return NextResponse.json(
        { ok: false, error: "Faltan WHATSAPP_TOKEN o WHATSAPP_PHONE_ID en .env.local" },
        { status: 500 }
      );
    }
    if (!to || typeof to !== "string") {
      return NextResponse.json({ ok: false, error: "Parámetro 'to' requerido" }, { status: 400 });
    }

    // En sandbox, si definimos WHATSAPP_TEST_TO forzamos ese destino:
    const finalTo = process.env.WHATSAPP_TEST_TO?.trim() || toNorm;

    const res = await fetch(
    `https://graph.facebook.com/v24.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
    {
        method: "POST",
        headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
        },
        body: JSON.stringify({
        messaging_product: "whatsapp",
        to: finalTo,
        type: "template",
        template: { name: "hello_world", language: { code: "en_US" } },
        }),
    }
    );

    const data = await res.json();
    if (!res.ok) {
      // Devuelve el error real para depurar en el cliente
      return NextResponse.json({ ok: false, error: data }, { status: 400 });
    }
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
