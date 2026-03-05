// app/api/whatsapp/phone-numbers/exchange-code/route.ts
import { NextResponse } from "next/server";
import { registerPhoneNumber } from "@/lib/whatsapp/phoneNumbers/registerPhoneNumber";

type Body = {
  companyId: string;
  locationId?: string | null;

  // OAuth code devuelto por FB.login(response_type="code")
  code: string;

  // Estos IDs NO los inventamos: deben venir del Embedded Signup (window.message WA_EMBEDDED_SIGNUP)
  wabaId: string;
  phoneNumberId: string;

  // Opcionales (si los tienes)
  displayPhoneNumber?: string | null;
  phoneNumberE164?: string | null;

  // opcional: si quieres activar directamente
  status?: "active" | "pending" | "disabled";
};

function str(v: unknown): string {
  if (typeof v === "string") return v.trim();
  return "";
}

function nullableStr(v: unknown): string | null {
  const s = str(v);
  if (!s) return null;
  return s;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as Body | null;

    const companyId = str(body ? body.companyId : "");
    const code = str(body ? body.code : "");
    const wabaId = str(body ? body.wabaId : "");
    const phoneNumberId = str(body ? body.phoneNumberId : "");

    const locationId = body && "locationId" in body ? (nullableStr(body.locationId) ?? null) : null;

    const displayPhoneNumber = body ? nullableStr(body.displayPhoneNumber) : null;
    const phoneNumberE164 = body ? nullableStr(body.phoneNumberE164) : null;

    const statusRaw = body ? str(body.status) : "";
    let status: "active" | "pending" | "disabled" | undefined = undefined;
    if (statusRaw === "active" || statusRaw === "pending" || statusRaw === "disabled") {
      status = statusRaw;
    }

    if (!companyId) {
      return NextResponse.json({ ok: false, error: "companyId requerido" }, { status: 400 });
    }
    if (!code) {
      return NextResponse.json({ ok: false, error: "code requerido" }, { status: 400 });
    }
    if (!wabaId) {
      return NextResponse.json({ ok: false, error: "wabaId requerido" }, { status: 400 });
    }
    if (!phoneNumberId) {
      return NextResponse.json({ ok: false, error: "phoneNumberId requerido" }, { status: 400 });
    }

    const appId = process.env.META_APP_ID ?? process.env.NEXT_PUBLIC_META_APP_ID ?? "";
    const appSecret = process.env.META_APP_SECRET ?? "";
    const redirectUri = process.env.WA_EMBEDDED_SIGNUP_REDIRECT_URI ?? "";

    if (!appId || !appSecret || !redirectUri) {
      return NextResponse.json(
        {
          ok: false,
          error: "Faltan env vars: META_APP_ID, META_APP_SECRET, WA_EMBEDDED_SIGNUP_REDIRECT_URI",
        },
        { status: 500 }
      );
    }

    // 1) Exchange code -> token
    const tokenUrl = new URL("https://graph.facebook.com/v20.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", appId);
    tokenUrl.searchParams.set("client_secret", appSecret);
    tokenUrl.searchParams.set("redirect_uri", redirectUri);
    tokenUrl.searchParams.set("code", code);

    const tokenResp = await fetch(tokenUrl.toString(), { method: "GET" });
    const tokenJson = (await tokenResp.json().catch(() => null)) as any;

    if (!tokenResp.ok || !tokenJson || typeof tokenJson.access_token !== "string") {
      return NextResponse.json(
        {
          ok: false,
          error: "No se pudo canjear el code por access_token",
          details: tokenJson,
        },
        { status: 400 }
      );
    }

    const accessToken = tokenJson.access_token as string;

    // TODO: guardar accessToken (y/o long-lived) asociado a company/phone en otra tabla.
    // Ahora mismo solo validamos que el exchange funciona.

    // 2) Registrar el número en tu tabla
    // Nota: phoneNumberE164 es requerido por registerPhoneNumber(); si no lo tienes aún,
    // envía displayPhoneNumber (digits) como aproximación temporal, o mejor: pásalo desde el evento WA_EMBEDDED_SIGNUP.
    const e164ToStore = phoneNumberE164 ? phoneNumberE164 : displayPhoneNumber ? displayPhoneNumber : "";

    if (!e164ToStore) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Falta phoneNumberE164 (o al menos displayPhoneNumber). Envíalo desde el Embedded Signup (evento WA_EMBEDDED_SIGNUP).",
        },
        { status: 400 }
      );
    }

    const row = await registerPhoneNumber({
      companyId,
      locationId,
      phoneNumberId,
      wabaId,
      phoneNumberE164: e164ToStore,
      displayPhoneNumber,
      status: status,
    });

    return NextResponse.json({
      ok: true,
      item: row,
      meta: {
        token_exchanged: true,
        access_token_present: Boolean(accessToken),
      },
    });
  } catch (e: any) {
    console.error("[phone-numbers/exchange-code] error:", e);
    return NextResponse.json({ ok: false, error: e.message || "Internal error" }, { status: 500 });
  }
}