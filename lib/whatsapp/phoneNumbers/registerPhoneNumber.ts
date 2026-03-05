// lib/whatsapp/phoneNumbers/registerPhoneNumber.ts
import { prisma } from "@/lib/prisma";

function digitsOnly(s: string): string {
  return String(s || "").replace(/[^\d]/g, "");
}

export type RegisterPhoneNumberInput = {
  companyId: string;
  locationId?: string | null;
  phoneNumberId: string; // Meta
  wabaId: string;
  phoneNumberE164: string;
  displayPhoneNumber?: string | null;
  status?: "active" | "pending" | "disabled";
};

export async function registerPhoneNumber(input: RegisterPhoneNumberInput) {
  const companyId = String(input.companyId || "").trim();
  const phoneNumberId = String(input.phoneNumberId || "").trim();
  const wabaId = String(input.wabaId || "").trim();
  const phoneNumberE164 = String(input.phoneNumberE164 || "").trim();
  const phoneNumberDigits = digitsOnly(phoneNumberE164);

  if (!companyId) throw new Error("Missing companyId");
  if (!phoneNumberId) throw new Error("Missing phoneNumberId");
  if (!wabaId) throw new Error("Missing wabaId");
  if (!phoneNumberE164) throw new Error("Missing phoneNumberE164");
  if (!phoneNumberDigits) throw new Error("Invalid phoneNumberE164");

  const status = input.status ? input.status : "pending";

  // Upsert por phone_number_id (único global)
  const row = await prisma.company_phone_number.upsert({
    where: { phone_number_id: phoneNumberId },
    create: {
      company_id: companyId,
      location_id: input.locationId ?? null,
      phone_number_e164: phoneNumberE164,
      phone_number_digits: phoneNumberDigits,
      phone_number_id: phoneNumberId,
      waba_id: wabaId,
      display_phone_number: input.displayPhoneNumber ?? null,
      status: status,
    },
    update: {
      // si ya existe, permitimos “re-asignar” a la misma company (y actualizar datos)
      company_id: companyId,
      location_id: input.locationId ?? null,
      phone_number_e164: phoneNumberE164,
      phone_number_digits: phoneNumberDigits,
      waba_id: wabaId,
      display_phone_number: input.displayPhoneNumber ?? null,
      status: status,
      updated_at: new Date(),
    },
    select: {
      id: true,
      company_id: true,
      location_id: true,
      phone_number_id: true,
      phone_number_e164: true,
      phone_number_digits: true,
      display_phone_number: true,
      waba_id: true,
      status: true,
      created_at: true,
      updated_at: true,
    },
  });

  return row;
}