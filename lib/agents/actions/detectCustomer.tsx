// lib/agents/actions/detectCustomer.tsx
import { prisma } from "@/lib/prisma";

function normalizePhone(p: string): string {
  return String(p || "").replace(/[^\d]/g, "");
}

function cleanName(s: string): string {
  return String(s || "").replace(/\s+/g, " ").trim();
}

export type DetectCustomerResult =
  | { kind: "KNOWN"; customerId: string; firstName: string; lastName: string }
  | { kind: "UNKNOWN" };

export async function detectCustomer(args: {
  companyId: string;
  sessionId: string;
  conversationId: string;
  phoneE164: string;
}): Promise<DetectCustomerResult> {
  const companyId = String(args.companyId || "").trim();
  const sessionId = String(args.sessionId || "").trim();
  const conversationId = String(args.conversationId || "").trim();
  const phone = normalizePhone(args.phoneE164);

  if (!companyId) throw new Error("Missing companyId");
  if (!sessionId) throw new Error("Missing sessionId");
  if (!conversationId) throw new Error("Missing conversationId");
  if (!phone) throw new Error("Missing phoneE164");

  return await prisma.$transaction(async (tx) => {
    // 1) Si ya está linkeada la conversación, damos por conocido (si existe)
    const convo = await tx.messaging_conversation.findUnique({
      where: { id: conversationId },
      select: { customer_id: true },
    });

    if (convo?.customer_id) {
      const c = await tx.customer.findUnique({
        where: { id: convo.customer_id },
        select: { id: true, firstName: true, lastName: true },
      });

      if (c) {
        await writeCustomerToSessionBoard(tx, {
          sessionId,
          customerId: c.id,
          firstName: c.firstName,
          lastName: c.lastName,
          phone,
        });

        return {
          kind: "KNOWN",
          customerId: c.id,
          firstName: c.firstName,
          lastName: c.lastName,
        };
      }
    }

    // 2) Buscar Customer global por phone
    const customer = await tx.customer.findFirst({
      where: { phone },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!customer) return { kind: "UNKNOWN" };

    // 3) Verificar relación con la company
    const link = await tx.companyCustomer.findUnique({
      where: {
        companyId_customerId: {
          companyId,
          customerId: customer.id,
        },
      },
      select: { id: true },
    });

    if (!link) return { kind: "UNKNOWN" };

    // 4) Linkear conversación a ese customer
    await tx.messaging_conversation.update({
      where: { id: conversationId },
      data: { customer_id: customer.id, updated_at: new Date() },
      select: { id: true },
    });

    // 5) Escribir en board
    await writeCustomerToSessionBoard(tx, {
      sessionId,
      customerId: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone,
    });

    return {
      kind: "KNOWN",
      customerId: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
    };
  });
}

// tx: any para evitar el problema de tipos del transaction client
async function writeCustomerToSessionBoard(
  tx: any,
  args: { sessionId: string; customerId: string; firstName: string; lastName: string; phone: string }
) {
  const session = await tx.agentSession.findUnique({
    where: { id: args.sessionId },
    select: { settings: true },
  });

  const prev = (session?.settings ?? null) as any;
  const nextSettings: any = {};

  if (prev && typeof prev === "object") {
    for (const k of Object.keys(prev)) {
      nextSettings[k] = prev[k];
    }
  }

  const board =
    nextSettings.board && typeof nextSettings.board === "object"
      ? nextSettings.board
      : {};

  const customerBoard =
    board.customer && typeof board.customer === "object" ? board.customer : {};

  customerBoard.id = args.customerId;
  customerBoard.name = cleanName(args.firstName + " " + args.lastName);
  customerBoard.phone = args.phone;

  board.customer = customerBoard;
  nextSettings.board = board;

  await tx.agentSession.update({
    where: { id: args.sessionId },
    data: { settings: nextSettings, updatedAt: new Date() },
    select: { id: true },
  });
}