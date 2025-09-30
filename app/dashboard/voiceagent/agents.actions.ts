"use server";

import { PrismaClient, AgentChannel, AgentStatus } from "@prisma/client";

const prisma = new PrismaClient();

export type AgentListItem = {
  id: string;
  name: string;
  slug?: string | null;
  isActive: boolean;
  companyCount?: number;
  updatedAt?: string; // ISO
};

function metaGetSlug(meta: any): string | null {
  try {
    if (!meta) return null;
    if (typeof meta === "object" && meta.slug) return String(meta.slug);
    return null;
  } catch {
    return null;
  }
}

function withDefaultSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

/** Lista agentes de voz. Si pasas companyId, filtra por esa empresa. */
export async function listVoiceAgents(companyId?: string): Promise<AgentListItem[]> {
  const agents = await prisma.agent.findMany({
    where: {
      channel: AgentChannel.VOICE,
      ...(companyId ? { companyId } : {}),
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      status: true,
      updatedAt: true,
      meta: true,
      voice: {
        select: { id: true }, // para contar companies.voiceAgentId
      },
    },
  });

  // cuenta cuántas compañías tienen asignado ese VoiceAgent
  const voiceIds = agents.map((a) => a.voice?.id).filter(Boolean) as string[];
  const counts =
    voiceIds.length === 0
      ? {}
      : Object.fromEntries(
          (
            await prisma.company.groupBy({
              by: ["voiceAgentId"],
              _count: { _all: true },
              where: { voiceAgentId: { in: voiceIds } },
            })
          ).map((g) => [g.voiceAgentId, g._count._all])
        );

  return agents.map((a) => ({
    id: a.id,
    name: a.name,
    slug: metaGetSlug(a.meta) ?? undefined,
    isActive: a.status === AgentStatus.ACTIVE,
    companyCount: a.voice?.id ? counts[a.voice.id] ?? 0 : 0,
    updatedAt: a.updatedAt.toISOString(),
  }));
}

/** Crea un nuevo Agent (VOICE) para una empresa concreta + VoiceAgent enlazado */
export async function createVoiceAgent(companyId: string): Promise<AgentListItem> {
  if (!companyId) throw new Error("companyId requerido");

  const name = "Nuevo agente";
  const slug = withDefaultSlug(name) + "-" + Math.random().toString(36).slice(2, 6);

  const created = await prisma.agent.create({
    data: {
      company: { connect: { id: companyId } }, // ⬅️ obligatorio
      name,
      channel: AgentChannel.VOICE,
      status: AgentStatus.PAUSED,
      meta: { slug },
      voice: {
        create: {
          defaultModel: "gpt-4o-mini",
          defaultTemperature: 0.3,
          defaultPrompt: "Eres una recepcionista cercana, clara y profesional. Hablas en español neutro.",
          language: "es-ES",
          provider: "mock",
        },
      },
    },
    select: {
      id: true,
      name: true,
      status: true,
      updatedAt: true,
      meta: true,
      voice: { select: { id: true } },
    },
  });

  return {
    id: created.id,
    name: created.name,
    slug,
    isActive: created.status === AgentStatus.ACTIVE,
    companyCount: 0,
    updatedAt: created.updatedAt.toISOString(),
  };
}

/** Duplica un Agent + VoiceAgent manteniendo la misma company del original */
export async function duplicateVoiceAgent(agentId: string): Promise<AgentListItem> {
  const src = await prisma.agent.findUnique({
    where: { id: agentId },
    select: {
      id: true,
      name: true,
      status: true,
      meta: true,
      companyId: true,
      voice: {
        select: {
          defaultModel: true,
          defaultTemperature: true,
          defaultPrompt: true,
          provider: true,
          providerConfig: true,
          voiceName: true,
          language: true,
        },
      },
    },
  });
  if (!src) throw new Error("Agente no encontrado");

  const baseName = `${src.name} (copia)`;
  const slug = `${metaGetSlug(src.meta) ?? withDefaultSlug(src.name)}-copy-${Math.random()
    .toString(36)
    .slice(2, 4)}`;

  const created = await prisma.agent.create({
    data: {
      company: { connect: { id: src.companyId } }, // ⬅️ mismo company
      name: baseName,
      channel: AgentChannel.VOICE,
      status: AgentStatus.PAUSED,
      meta: { slug },
      voice: {
        create: {
          defaultModel: src.voice?.defaultModel ?? "gpt-4o-mini",
          defaultTemperature: src.voice?.defaultTemperature ?? 0.3,
          defaultPrompt:
            src.voice?.defaultPrompt ??
            "Eres una recepcionista cercana, clara y profesional. Hablas en español neutro.",
          provider: src.voice?.provider ?? "mock",
          providerConfig: src.voice?.providerConfig ?? {},
          voiceName: src.voice?.voiceName ?? null,
          language: src.voice?.language ?? "es-ES",
        },
      },
    },
    select: {
      id: true,
      name: true,
      status: true,
      updatedAt: true,
      meta: true,
      voice: { select: { id: true } },
    },
  });

  return {
    id: created.id,
    name: created.name,
    slug,
    isActive: created.status === AgentStatus.ACTIVE,
    companyCount: 0,
    updatedAt: created.updatedAt.toISOString(),
  };
}

/** Elimina un Agent (cascade a VoiceAgent por FK) */
export async function deleteVoiceAgent(agentId: string): Promise<{ ok: true }> {
  await prisma.agent.delete({ where: { id: agentId } });
  return { ok: true };
}

/** Renombra */
export async function renameVoiceAgent(agentId: string, name: string): Promise<{ ok: true }> {
  await prisma.agent.update({
    where: { id: agentId },
    data: { name },
  });
  return { ok: true };
}

/** Activa / pausa */
export async function toggleVoiceAgent(agentId: string, nextActive: boolean): Promise<{ ok: true }> {
  await prisma.agent.update({
    where: { id: agentId },
    data: { status: nextActive ? AgentStatus.ACTIVE : AgentStatus.PAUSED },
  });
  return { ok: true };
}