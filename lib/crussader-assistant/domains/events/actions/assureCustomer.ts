// lib/crussader-assistant/actions/events/actions/assureCustomer.ts

import { prisma } from "@/lib/prisma";

function normalizePhone(p: string) {
  return String(p || "").replace(/[^\d]/g, "");
}

function asText(v: unknown) {
  return String(v || "").trim();
}

function isUnknownName(value: unknown) {
  return asText(value).toLowerCase() === "unknown";
}

export type AssureAssistantCustomerResult =
  | {
      kind: "CREATED_AND_LINKED";
      customerId: string;
    }
  | {
      kind: "LINKED_EXISTING";
      customerId: string;
    }
  | {
      kind: "EXISTING_LINKED";
      customerId: string;
    };

export async function assureCustomer(args: {
  companyId: string;
  phone: string;
  contactName?: string | null;
  conversationId?: string | null;
}): Promise<AssureAssistantCustomerResult> {
  const companyId = asText(args.companyId);
  const phone = normalizePhone(args.phone);
  const contactName = asText(args.contactName);

  if (!companyId) throw new Error("Missing companyId");
  if (!phone) throw new Error("Missing phone");

  const customer = await prisma.customer.findFirst({
    where: { phone },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      whatsapp_name: true,
    },
  });

  if (!customer) {
    const created = await prisma.customer.create({
      data: {
        phone,
        whatsapp_name: contactName || null,
        firstName: "Unknown",
        lastName: "Unknown",
      },
      select: { id: true },
    });

    await prisma.companyCustomer.create({
      data: {
        companyId,
        customerId: created.id,
      },
    });

    return {
      kind: "CREATED_AND_LINKED",
      customerId: created.id,
    };
  }

const currentWhatsappName = asText(customer.whatsapp_name);

const shouldUpdateWhatsappName =
  contactName.length > 0 &&
  (
    currentWhatsappName.length === 0 ||
    currentWhatsappName.toLowerCase() === "unknown"
  ) &&
  currentWhatsappName !== contactName;

  if (shouldUpdateWhatsappName) {
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        whatsapp_name: contactName,
      },
      select: { id: true },
    });
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

  if (!link) {
    await prisma.companyCustomer.create({
      data: {
        companyId,
        customerId: customer.id,
      },
    });

    return {
      kind: "LINKED_EXISTING",
      customerId: customer.id,
    };
  }

  return {
    kind: "EXISTING_LINKED",
    customerId: customer.id,
  };
}