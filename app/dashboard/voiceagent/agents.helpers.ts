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
