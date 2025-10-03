// app/dashboard/admin/voiceagents/actions/agents.helpers.ts
"use server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/** Devuelve el VoiceAgent.id asociado a un Agent.id (o null) */
export async function getVoiceAgentIdByAgent(agentId: string): Promise<string | null> {
  if (!agentId) return null;
  const a = await prisma.agent.findUnique({
    where: { id: agentId },
    select: { voice: { select: { id: true } } },
  });
  return a?.voice?.id ?? null;
}

export async function resolveCompanyId(input: { companyId?: string; agentId?: string }) {
  if (input.companyId) return input.companyId;
  if (!input.agentId) return null;
  const agent = await prisma.agent.findUnique({
    where: { id: input.agentId },
    select: { companyId: true },
  });
  return agent?.companyId ?? null;
}

/** NUEVO: Construye bloque de conocimiento público para esa empresa */
export async function buildCompanyKnowledge(companyId: string) {
  if (!companyId) return { text: "", sections: [] as { title: string; content: string }[] };

  const rows = await prisma.knowledgeSection.findMany({
    where: { companyId, visibility: "PUBLIC", isActive: true },
    orderBy: { position: "asc" },
    select: { title: true, content: true },
  });

  const text = rows
    .map(
      (r, i) =>
        `### ${i + 1}. ${r.title?.trim() || "Sección"}\n${(r.content || "").trim()}`
    )
    .join("\n\n");

  return { text, sections: rows };
}