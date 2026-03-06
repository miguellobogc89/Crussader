// lib/agents/actions/idetinfyCustomer.tsx
import { prisma } from "@/lib/prisma";

function normalizePhone(p: string): string {
  return String(p || "").replace(/[^\d]/g, "");
}

function safeTrim(s: unknown): string {
  return String(s || "").trim();
}

export type IdentifyCustomerResult =
  | {
      kind: "COMPANY";
      customerId: string;
      customerName: string | null;
      phone: string;
    }
  | {
      kind: "GLOBAL_ONLY";
      customerId: string;
      customerName: string | null;
      phone: string;
    }
  | {
      kind: "NONE";
      customerId: null;
      customerName: null;
      phone: string;
    };

export async function identifyCustomer(args: {
  companyId: string;
  phone: string;
}): Promise<IdentifyCustomerResult> {
  const companyId = safeTrim(args.companyId);
  const phone = normalizePhone(args.phone);

  if (!companyId) throw new Error("Missing companyId");
  if (!phone) throw new Error("Missing phone");

  const customer = await prisma.customer.findFirst({
    where: {
      OR: [
        { phone },
        { secondary_phone: phone },
      ],
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      companies: {
        where: { companyId },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!customer) {
    return {
      kind: "NONE",
      customerId: null,
      customerName: null,
      phone,
    };
  }

  const firstName = safeTrim(customer.firstName);
  const lastName = safeTrim(customer.lastName);

  let fullName = "";
  if (firstName.length > 0 && lastName.length > 0) {
    fullName = firstName + " " + lastName;
  } else if (firstName.length > 0) {
    fullName = firstName;
  } else if (lastName.length > 0) {
    fullName = lastName;
  }

  const nameOut = fullName.length > 0 ? fullName : null;

  const linked =
    Array.isArray(customer.companies) && customer.companies.length > 0;

  if (linked) {
    return {
      kind: "COMPANY",
      customerId: customer.id,
      customerName: nameOut,
      phone,
    };
  }

  return {
    kind: "GLOBAL_ONLY",
    customerId: customer.id,
    customerName: nameOut,
    phone,
  };
}