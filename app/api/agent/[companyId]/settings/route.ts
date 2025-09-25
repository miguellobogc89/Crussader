// /app/api/agent/[companyId]/settings/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

/** Auth: Authorization: Bearer <CALENDAR_API_KEY> */
function checkAuth(req: Request) {
  const apiKey = process.env.CALENDAR_API_KEY;
  if (!apiKey) {
    return {
      ok: false as const,
      res: NextResponse.json(
        { ok: false, error: "Server misconfigured: missing CALENDAR_API_KEY" },
        { status: 500 }
      ),
    };
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${apiKey}`) {
    return {
      ok: false as const,
      res: NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { ok: true as const };
}

/** Zod schema (v4 classic): usar record(keyType, valueType) */
const AgentSettingsSchema = z
  .object({
    version: z.number().optional(),
    llm: z
      .object({
        model: z.string().optional(),
        temperature: z.number().min(0).max(2).optional(),
        maxTokens: z.number().int().positive().optional(),
      })
      .optional(),
    style: z
      .object({
        language: z.string().optional(),
        persona: z.string().optional(),
        suggestMaxSlots: z.number().int().min(1).max(12).optional(),
        closingQuestion: z.boolean().optional(),
      })
      .optional(),
    nlu: z
      .object({
        services: z.record(z.string(), z.array(z.string())).optional(),
        actions: z.record(z.string(), z.array(z.string())).optional(),
      })
      .optional(),
    flow: z
      .object({
        identify: z
          .object({
            system: z.string().optional(),
            assistantPrompt: z.string().optional(),
            missingNameFollowup: z.string().optional(),
            missingPhoneFollowup: z.string().optional(),
          })
          .optional(),
        intent: z
          .object({
            system: z.string().optional(),
            assistantPrompt: z.string().optional(),
          })
          .optional(),
        servicePipelines: z
          .record(
            z.string(),
            z.object({
              checklist: z.array(z.string()).optional(),
              proposeStrategy: z
                .object({
                  type: z.string().optional(),
                  maxSlots: z.number().int().optional(),
                  prefer: z.string().optional(),
                })
                .optional(),
              confirmPrompt: z.string().optional(),
            })
          )
          .optional(),
        fallback: z
          .object({
            firstRetry: z.string().optional(),
            secondRetry: z.string().optional(),
            leaveCommentTemplate: z.string().optional(),
          })
          .optional(),
      })
      .optional(),
  })
  .passthrough();

/** GET: devuelve agentSettings (o {} si no hay) */
export async function GET(req: Request, { params }: { params: { companyId: string } }) {
  const a = checkAuth(req);
  if (!a.ok) return a.res;

  const { companyId } = params;

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true, agentSettings: true },
  });

  if (!company) {
    return NextResponse.json({ ok: false, error: "Company not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, settings: company.agentSettings ?? {} });
}

/** PUT: guarda agentSettings (reemplaza el JSON completo) */
export async function PUT(req: Request, { params }: { params: { companyId: string } }) {
  const a = checkAuth(req);
  if (!a.ok) return a.res;

  const { companyId } = params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = AgentSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Validation error", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updated = await prisma.company.update({
    where: { id: companyId },
    data: { agentSettings: parsed.data as any },
    select: { id: true, agentSettings: true },
  });

  return NextResponse.json({ ok: true, settings: updated.agentSettings ?? {} });
}
