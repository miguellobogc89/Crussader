// lib/agents/actions/assureCustomer.tsx
import { prisma } from "@/lib/prisma";

function normalizePhone(p: string): string {
  return String(p || "").replace(/[^\d]/g, "");
}

function clean(v: unknown): string {
  return String(v || "").trim();
}

export type AssureCustomerResult =
  | {
      kind: "CREATED_UNKNOWN";
      customerId: string;
      phone: string;
      secondaryPhone: string | null;
      firstName: string;
      lastName: string;
      email: string | null;
    }
  | {
      kind: "UPDATED_FROM_UNKNOWN";
      customerId: string;
      phone: string;
      secondaryPhone: string | null;
      firstName: string;
      lastName: string;
      email: string | null;
    }
  | {
      kind: "UPDATED_CONTACT";
      customerId: string;
      phone: string;
      secondaryPhone: string | null;
      firstName: string;
      lastName: string;
      email: string | null;
      changedPhone: boolean;
      changedEmail: boolean;
    }
  | {
      kind: "EXISTING_NO_CHANGE";
      customerId: string;
      phone: string;
      secondaryPhone: string | null;
      firstName: string;
      lastName: string;
      email: string | null;
    };

export async function assureCustomer(args: {
  phone: string; // teléfono desde el que escribe (digits)
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;

  // Si la IA detecta que el cliente dice “mi número es otro”
  newPrimaryPhone?: string | null;

  agentId?: string | null;
  sessionId?: string | null;
}): Promise<AssureCustomerResult> {
  const incomingPhone = normalizePhone(args.phone);
  if (!incomingPhone) throw new Error("Missing phone");

  const inputFirst = clean(args.firstName);
  const inputLast = clean(args.lastName);

  let inputEmail: string | null = null;
  if (args.email) {
    const e = clean(args.email);
    if (e.length > 0) inputEmail = e;
  }

  let newPrimaryPhone: string | null = null;
  if (args.newPrimaryPhone) {
    const p2 = normalizePhone(args.newPrimaryPhone);
    if (p2.length > 0) newPrimaryPhone = p2;
  }

  const existing = await prisma.customer.findFirst({
    where: { phone: incomingPhone },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
      secondary_phone: true,
    },
  });

  // 1) NO EXISTE → crear (Unknown o con nombre si viene)
  if (!existing) {
    const created = await prisma.customer.create({
      data: {
        phone: incomingPhone,
        firstName: inputFirst.length > 0 ? inputFirst : "Unknown",
        lastName: inputLast.length > 0 ? inputLast : "Unknown",
        email: inputEmail,
        secondary_phone: null,
        createdByAgentId: args.agentId || null,
        createdInSessionId: args.sessionId || null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        secondary_phone: true,
      },
    });

    return {
      kind: "CREATED_UNKNOWN",
      customerId: created.id,
      phone: created.phone,
      secondaryPhone: created.secondary_phone,
      firstName: created.firstName,
      lastName: created.lastName,
      email: created.email,
    };
  }

  const isUnknown =
    existing.firstName === "Unknown" && existing.lastName === "Unknown";

  const hasRealName = inputFirst.length > 0 && inputLast.length > 0;

  // 2) EXISTE y era Unknown → actualizar nombre + email (si viene)
  if (isUnknown && hasRealName) {
    const updated = await prisma.customer.update({
      where: { id: existing.id },
      data: {
        firstName: inputFirst,
        lastName: inputLast,
        email: inputEmail ? inputEmail : existing.email,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        secondary_phone: true,
      },
    });

    return {
      kind: "UPDATED_FROM_UNKNOWN",
      customerId: updated.id,
      phone: updated.phone,
      secondaryPhone: updated.secondary_phone,
      firstName: updated.firstName,
      lastName: updated.lastName,
      email: updated.email,
    };
  }

  // 3) Update de contacto (email y/o cambio de phone)
  let shouldChangePhone = false;
  if (newPrimaryPhone) {
    if (newPrimaryPhone !== existing.phone) {
      shouldChangePhone = true;
    }
  }

  let shouldChangeEmail = false;
  if (inputEmail) {
    if (existing.email !== inputEmail) {
      shouldChangeEmail = true;
    }
  }

  if (shouldChangePhone || shouldChangeEmail) {
    const nextPhone = shouldChangePhone ? (newPrimaryPhone as string) : existing.phone;

    const nextSecondary =
      shouldChangePhone ? existing.phone : existing.secondary_phone;

    const nextEmail = shouldChangeEmail ? inputEmail : existing.email;

    const updated = await prisma.customer.update({
      where: { id: existing.id },
      data: {
        phone: nextPhone,
        secondary_phone: nextSecondary,
        email: nextEmail,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        secondary_phone: true,
      },
    });

    return {
      kind: "UPDATED_CONTACT",
      customerId: updated.id,
      phone: updated.phone,
      secondaryPhone: updated.secondary_phone,
      firstName: updated.firstName,
      lastName: updated.lastName,
      email: updated.email,
      changedPhone: shouldChangePhone,
      changedEmail: shouldChangeEmail,
    };
  }

  // 4) EXISTE y no cambia nada
  return {
    kind: "EXISTING_NO_CHANGE",
    customerId: existing.id,
    phone: existing.phone,
    secondaryPhone: existing.secondary_phone,
    firstName: existing.firstName,
    lastName: existing.lastName,
    email: existing.email,
  };
}