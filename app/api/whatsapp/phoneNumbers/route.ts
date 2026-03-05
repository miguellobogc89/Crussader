// app/api/whatsapp/phoneNumbers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type PhoneStatus = "active" | "pending" | "disabled";

function asPhoneStatus(s: any): PhoneStatus {
  if (s === "active" || s === "pending" || s === "disabled") return s;
  return "active";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const companyId = searchParams.get("companyId");
  const locationId = searchParams.get("locationId"); // opcional

  if (!companyId) {
    return NextResponse.json({ ok: false, error: "companyId requerido" }, { status: 400 });
  }

  // 1) Intentar tabla normalizada (si existe data)
  const dbRows = await prisma.company_phone_number.findMany({
    where: {
      company_id: companyId,
      ...(locationId ? { location_id: locationId } : {}),
      status: "active",
    },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      company_id: true,
      location_id: true,
      status: true,
      phone_number_id: true,
      display_phone_number: true,
      phone_number_e164: true,
      waba_id: true,
      created_at: true,
      updated_at: true,
    },
  });

  if (dbRows.length > 0) {
    const items = dbRows.map((p) => ({
      source: "company_phone_number" as const,
      id: p.id,
      companyId: p.company_id,
      locationId: p.location_id,
      status: asPhoneStatus(p.status),
      phoneNumberId: p.phone_number_id,
      displayPhoneNumber: p.display_phone_number,
      phoneNumberE164: p.phone_number_e164,
      wabaId: p.waba_id,
      installationId: null as string | null,
    }));

    return NextResponse.json({ ok: true, items });
  }

  // 2) Fallback: integration_installation.config (tu caso actual)
  const installs = await prisma.integration_installation.findMany({
    where: {
      company_id: companyId,
      ...(locationId ? { location_id: locationId } : {}),
      provider: "whatsapp",
      status: "active",
    },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      company_id: true,
      location_id: true,
      status: true,
      config: true,
      created_at: true,
      updated_at: true,
    },
  });

  const items = installs
    .map((inst) => {
      const cfg: any = inst.config || {};
      const phoneNumberId = typeof cfg.phone_number_id === "string" ? cfg.phone_number_id : null;
      const displayPhoneNumber =
        typeof cfg.display_phone_number === "string" ? cfg.display_phone_number : null;

      if (!phoneNumberId && !displayPhoneNumber) return null;

      return {
        source: "integration_installation" as const,
        id: inst.id, // aquí usamos installation id como id
        companyId: inst.company_id,
        locationId: inst.location_id,
        status: "active" as PhoneStatus,
        phoneNumberId: phoneNumberId,
        displayPhoneNumber: displayPhoneNumber,
        phoneNumberE164: displayPhoneNumber,
        wabaId: null as string | null,
        installationId: inst.id,
      };
    })
    .filter(Boolean);

  return NextResponse.json({ ok: true, items });
}