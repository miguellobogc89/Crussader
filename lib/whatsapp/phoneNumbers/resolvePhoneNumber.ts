// lib/whatsapp/phoneNumbers/resolvePhoneNumber.ts
import { prisma } from "@/lib/prisma";

export type ResolvedPhoneNumber = {
  companyId: string;
  locationId: string | null;
  phone: {
    id: string; // uuid
    phoneNumberId: string; // Meta phone_number_id
    phoneNumberE164: string;
    displayPhoneNumber: string | null;
    wabaId: string;
    status: "active" | "pending" | "disabled";
  };
};

export async function resolvePhoneNumber(phoneNumberId: string): Promise<ResolvedPhoneNumber | null> {
  const metaId = String(phoneNumberId || "").trim();
  if (!metaId) return null;

  const row = await prisma.company_phone_number.findUnique({
    where: { phone_number_id: metaId },
    select: {
      id: true,
      company_id: true,
      location_id: true,
      phone_number_id: true,
      phone_number_e164: true,
      display_phone_number: true,
      waba_id: true,
      status: true,
    },
  });

  if (!row) return null;

  return {
    companyId: row.company_id,
    locationId: row.location_id,
    phone: {
      id: row.id,
      phoneNumberId: row.phone_number_id,
      phoneNumberE164: row.phone_number_e164,
      displayPhoneNumber: row.display_phone_number,
      wabaId: row.waba_id,
      status: row.status,
    },
  };
}