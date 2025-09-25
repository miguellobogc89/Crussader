// /app/dashboard/voiceagent/actions.ts
"use server";

import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const AgentSettingsSchema = z
  .object({
    version: z.number().optional(),
    llm: z.object({ model: z.string().optional(), temperature: z.number().optional(), maxTokens: z.number().optional() }).optional(),
    style: z.object({ language: z.string().optional(), persona: z.string().optional(), suggestMaxSlots: z.number().optional(), closingQuestion: z.boolean().optional() }).optional(),
    nlu: z.object({
      services: z.record(z.string(), z.array(z.string())).optional(),
      actions:  z.record(z.string(), z.array(z.string())).optional(),
    }).optional(),
    flow: z.object({
      identify: z.object({
        system: z.string().optional(),
        assistantPrompt: z.string().optional(),
        missingNameFollowup: z.string().optional(),
        missingPhoneFollowup: z.string().optional(),
      }).optional(),
      intent: z.object({ system: z.string().optional(), assistantPrompt: z.string().optional() }).optional(),
      servicePipelines: z.record(
        z.string(),
        z.object({
          checklist: z.array(z.string()).optional(),
          proposeStrategy: z.object({ type: z.string().optional(), maxSlots: z.number().optional(), prefer: z.string().optional() }).optional(),
          confirmPrompt: z.string().optional(),
        })
      ).optional(),
      fallback: z.object({ firstRetry: z.string().optional(), secondRetry: z.string().optional(), leaveCommentTemplate: z.string().optional() }).optional(),
    }).optional(),
  })
  .passthrough();

export async function loadAgentSettings(companyId: string) {
  if (!companyId) throw new Error("companyId requerido");
  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { id: true, agentSettings: true } });
  return company?.agentSettings ?? {};
}

export async function saveAgentSettings(companyId: string, settings: unknown) {
  if (!companyId) throw new Error("companyId requerido");
  const parsed = AgentSettingsSchema.safeParse(settings);
  if (!parsed.success) throw new Error("agentSettings inválidos");
  const updated = await prisma.company.update({ where: { id: companyId }, data: { agentSettings: parsed.data as any }, select: { id: true } });
  return { ok: true, id: updated.id };
}

/** Para mostrar el nombre de la empresa en la UI */
export async function loadCompanyMeta(companyId: string) {
  if (!companyId) throw new Error("companyId requerido");
  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { id: true, name: true } });
  if (!company) return null;
  return { id: company.id, name: company.name };
}
