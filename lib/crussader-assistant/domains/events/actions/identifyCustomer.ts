// lib/crussader-assistant/domains/events/actions/identifyCustomer.ts

import { prisma } from "@/lib/prisma";

function normalizePhone(p: string) {
  return String(p || "").replace(/[^\d]/g, "");
}

function asText(v: unknown) {
  return String(v || "").trim();
}

export type IdentifyAssistantCustomerResult =
  | {
      kind: "KNOWN_THIS_COMPANY";
      customerId: string;
      phone: string;
    }
  | {
      kind: "EXISTS_OTHER_COMPANY";
      customerId: string;
      phone: string;
    }
  | {
      kind: "NONE";
      customerId: null;
      phone: string;
    };

export async function identifyCustomer(args: {
  companyId: string;
  phone: string;
}): Promise<IdentifyAssistantCustomerResult> {
  const companyId = asText(args.companyId);
  const phone = normalizePhone(args.phone);

  if (!companyId) throw new Error("Missing companyId");
  if (!phone) throw new Error("Missing phone");

  const customer = await prisma.customer.findFirst({
    where: { phone },
    select: { id: true },
  });

  if (!customer) {
    return {
      kind: "NONE",
      customerId: null,
      phone,
    };
  }

  const link = await prisma.companyCustomer.findUnique({
    where: {
      companyId_customerId: {
        companyId,
        customerId: customer.id,
      },
    },
    select: { id: true },
  });

  if (link) {
    return {
      kind: "KNOWN_THIS_COMPANY",
      customerId: customer.id,
      phone,
    };
  }

  return {
    kind: "EXISTS_OTHER_COMPANY",
    customerId: customer.id,
    phone,
  };
}