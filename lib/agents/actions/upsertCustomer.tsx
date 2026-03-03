// lib/agents/actions/upsertCustomer.tsx
import { prisma } from "@/lib/prisma";

function normalizePhone(p: string): string {
  return String(p || "").replace(/[^\d]/g, "");
}

function cleanName(s: string): string {
  return String(s || "").replace(/\s+/g, " ").trim();
}

export type UpsertCustomerResult =
  | {
      kind: "CREATED";
      customerId: string;
      firstName: string;
      lastName: string;
      board_patch: Record<string, unknown>;
    }
  | {
      kind: "EXISTING";
      customerId: string;
      firstName: string;
      lastName: string;
      board_patch: Record<string, unknown>;
    };

export async function upsertCustomer(args: {
  companyId: string;
  agentId: string;
  sessionId: string;

  conversationId: string;
  phoneE164: string;
  firstName: string;
  lastName: string;
  email?: string | null;
}): Promise<UpsertCustomerResult> {
  const companyId = String(args.companyId || "").trim();
  const agentId = String(args.agentId || "").trim();
  const sessionId = String(args.sessionId || "").trim();
  const conversationId = String(args.conversationId || "").trim();

  const phone = normalizePhone(args.phoneE164);
  const firstName = cleanName(args.firstName);
  const lastName = cleanName(args.lastName);

  if (!companyId) throw new Error("Missing companyId");
  if (!agentId) throw new Error("Missing agentId");
  if (!sessionId) throw new Error("Missing sessionId");
  if (!conversationId) throw new Error("Missing conversationId");
  if (!phone) throw new Error("Missing phoneE164");
  if (!firstName) throw new Error("Missing firstName");
  if (!lastName) throw new Error("Missing lastName");

  const email = args.email ? String(args.email).trim() : null;

  return await prisma.$transaction(async (tx) => {
    const existing = await tx.customer.findFirst({
      where: { phone },
      select: { id: true, firstName: true, lastName: true },
    });

    let customerId: string;
    let finalFirstName: string;
    let finalLastName: string;
    let kind: "CREATED" | "EXISTING";

    if (existing) {
      customerId = existing.id;
      finalFirstName = existing.firstName;
      finalLastName = existing.lastName;
      kind = "EXISTING";
    } else {
      const created = await tx.customer.create({
        data: {
          firstName,
          lastName,
          phone,
          email,
          createdByAgentId: agentId,
          createdInSessionId: sessionId,
          companies: { create: { companyId } },
        },
        select: { id: true, firstName: true, lastName: true },
      });

      customerId = created.id;
      finalFirstName = created.firstName;
      finalLastName = created.lastName;
      kind = "CREATED";
    }

    await tx.companyCustomer.upsert({
      where: { companyId_customerId: { companyId, customerId } },
      create: { companyId, customerId },
      update: {},
      select: { id: true },
    });

    await tx.messaging_conversation.update({
      where: { id: conversationId },
      data: { customer_id: customerId, updated_at: new Date() },
      select: { id: true },
    });

    const fullName = cleanName(finalFirstName + " " + finalLastName);

    const board_patch = {
      customer: { name: fullName, phone },
      state: {
        customer: { id: customerId, updatedAt: new Date().toISOString() },
      },
    };

    return {
      kind,
      customerId,
      firstName: finalFirstName,
      lastName: finalLastName,
      board_patch,
    };
  });
}