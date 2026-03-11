// lib/agents/stages/recognitionStage.ts
import { prisma } from "@/lib/prisma";
import { readSessionBoard, type StageResult } from "@/lib/agents/chat/sessionBoardHydrator";

function normalizePhone(p: string): string {
  return String(p || "").replace(/[^\d]/g, "");
}

export type CustomerScope = "NONE" | "GLOBAL_ONLY" | "COMPANY";

export type RecognitionOutput = {
  scope: CustomerScope;
  customerId: string | null;
  customerName: string | null;
  phone: string;
};

function getStageDoneFlagFromBoard(board: any): boolean {
  const rec = board?.state?.stages?.recognition;
  if (!rec || typeof rec !== "object") return false;
  return rec.done === true;
}

export async function recognitionStage(args: {
  companyId: string;
  sessionId: string;
  phoneE164: string;
}): Promise<{ result: StageResult; out: RecognitionOutput }> {
  const companyId = String(args.companyId || "").trim();
  const sessionId = String(args.sessionId || "").trim();
  const phone = normalizePhone(args.phoneE164);

  if (!companyId) throw new Error("Missing companyId");
  if (!sessionId) throw new Error("Missing sessionId");
  if (!phone) throw new Error("Missing phoneE164");

  const board = await readSessionBoard(sessionId);
  const alreadyDone = getStageDoneFlagFromBoard(board);

  const customer = await prisma.customer.findFirst({
    where: { phone },
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
    const out: RecognitionOutput = {
      scope: "NONE",
      customerId: null,
      customerName: null,
      phone,
    };

    return {
      result: {
        done: false,
        missing: ["name"],
        board_patch: {
          customer: { phone },
          state: {
            stages: {
              recognition: {
                done: false,
                scope: out.scope,
                customerId: null,
                updatedAt: new Date().toISOString(),
              },
            },
          },
        },
      },
      out,
    };
  }

  const linkedToCompany = Array.isArray(customer.companies) && customer.companies.length > 0;
  if (!linkedToCompany) {
    const out: RecognitionOutput = {
      scope: "GLOBAL_ONLY",
      customerId: null,
      customerName: null,
      phone,
    };

    return {
      result: {
        done: false,
        missing: ["name"],
        board_patch: {
          customer: { phone },
          state: {
            stages: {
              recognition: {
                done: false,
                scope: out.scope,
                customerId: null,
                updatedAt: new Date().toISOString(),
              },
            },
          },
        },
      },
      out,
    };
  }

  const firstName = String(customer.firstName || "").trim();
  const lastName = String(customer.lastName || "").trim();
  const fullName = (firstName + " " + lastName).replace(/\s+/g, " ").trim();
  const hasName = fullName.length > 0;

  const out: RecognitionOutput = {
    scope: "COMPANY",
    customerId: customer.id,
    customerName: hasName ? fullName : null,
    phone,
  };

  if (alreadyDone) {
    return { result: { done: true, missing: [] }, out };
  }

  const missing: string[] = [];
  if (!hasName) missing.push("name");

  const done = missing.length === 0;

  return {
    result: {
      done,
      missing,
      board_patch: {
        customer: { phone, name: hasName ? fullName : null },
        state: {
          stages: {
            recognition: {
              done,
              scope: out.scope,
              customerId: out.customerId,
              updatedAt: new Date().toISOString(),
            },
          },
        },
      },
    },
    out,
  };
}