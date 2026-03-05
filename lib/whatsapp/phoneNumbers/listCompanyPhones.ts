// lib/whatsapp/phoneNumbers/listCompanyPhones.ts
import { prisma } from "@/lib/prisma";

export type CompanyPhoneItem = {
  id: string; // uuid
  companyId: string;
  locationId: string | null;
  status: "active" | "pending" | "disabled";
  phoneNumberId: string;
  phoneNumberE164: string;
  phoneNumberDigits: string;
  displayPhoneNumber: string | null;
  wabaId: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function listCompanyPhones(args: {
  companyId: string;
  locationId?: string | null;
  onlyActive?: boolean;
}) {
  const companyId = String(args.companyId || "").trim();
  if (!companyId) return [];

  const where: any = { company_id: companyId };

  if (args.locationId !== undefined) {
    where.location_id = args.locationId;
  }

  if (args.onlyActive) {
    where.status = "active";
  }

  const rows = await prisma.company_phone_number.findMany({
    where,
    orderBy: [{ status: "asc" }, { created_at: "asc" }],
    select: {
      id: true,
      company_id: true,
      location_id: true,
      status: true,
      phone_number_id: true,
      phone_number_e164: true,
      phone_number_digits: true,
      display_phone_number: true,
      waba_id: true,
      created_at: true,
      updated_at: true,
    },
  });

  return rows.map(
    (r): CompanyPhoneItem => ({
      id: r.id,
      companyId: r.company_id,
      locationId: r.location_id,
      status: r.status,
      phoneNumberId: r.phone_number_id,
      phoneNumberE164: r.phone_number_e164,
      phoneNumberDigits: r.phone_number_digits,
      displayPhoneNumber: r.display_phone_number,
      wabaId: r.waba_id,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })
  );
}