// app/api/whatsapp/phone-numbers/register/route.ts
import { NextResponse } from "next/server";
import { registerPhoneNumber } from "@/lib/whatsapp/phoneNumbers/registerPhoneNumber";

type Body = {
  companyId: string;
  locationId?: string | null;
  phoneNumberId: string;
  wabaId: string;
  phoneNumberE164: string;
  displayPhoneNumber?: string | null;
  status?: "active" | "pending" | "disabled";
};

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as Body | null;

    const companyId = body && typeof body.companyId === "string" ? body.companyId : "";
    const phoneNumberId =
      body && typeof body.phoneNumberId === "string" ? body.phoneNumberId : "";
    const wabaId = body && typeof body.wabaId === "string" ? body.wabaId : "";
    const phoneNumberE164 =
      body && typeof body.phoneNumberE164 === "string" ? body.phoneNumberE164 : "";

    const locationId =
      body && "locationId" in body ? (body.locationId ?? null) : undefined;

    const displayPhoneNumber =
      body && typeof body.displayPhoneNumber === "string" ? body.displayPhoneNumber : null;

    const status =
      body && typeof body.status === "string" ? (body.status as any) : undefined;

    if (!companyId) {
      return NextResponse.json({ ok: false, error: "companyId requerido" }, { status: 400 });
    }
    if (!phoneNumberId) {
      return NextResponse.json({ ok: false, error: "phoneNumberId requerido" }, { status: 400 });
    }
    if (!wabaId) {
      return NextResponse.json({ ok: false, error: "wabaId requerido" }, { status: 400 });
    }
    if (!phoneNumberE164) {
      return NextResponse.json({ ok: false, error: "phoneNumberE164 requerido" }, { status: 400 });
    }

    const row = await registerPhoneNumber({
      companyId,
      locationId,
      phoneNumberId,
      wabaId,
      phoneNumberE164,
      displayPhoneNumber,
      status,
    });

    return NextResponse.json({ ok: true, item: row });
  } catch (e: any) {
    console.error("[phone-numbers/register] error:", e);
    return NextResponse.json({ ok: false, error: e.message || "Internal error" }, { status: 500 });
  }
}