// app/dashboard/voiceagent/flow.actions.ts
"use server";

import { PrismaClient } from "@prisma/client";

export type Stage = {
  id?: string;           // id del AgentPhase (pivot) si ya existe
  phaseId?: string;      // id de Phase si ya existe
  key?: string;          // slug clave de Phase (p.ej. "intro")
  label: string;
  type: "INTRO" | "COLLECT" | "INTENT" | "CUSTOM";
  order: number;
  priority?: number | null;
  prompt?: string;       // override opcional
  meta?: Record<string, any> | null;
  isEnabled?: boolean;
};

const prisma = new PrismaClient();

/** Carga el flujo (joins del pivot AgentPhase con Phase) */
export async function listStages(voiceAgentId: string): Promise<Stage[]> {
  const rows = await prisma.agentPhase.findMany({
    where: { agentId: voiceAgentId },
    orderBy: { order: "asc" },
    include: { phase: true },
  });

  return rows.map((r) => ({
    id: r.id,                 // id del pivot
    phaseId: r.phaseId,       // id de Phase
    key: r.phase.key,
    label: r.phase.label,
    type: r.phase.type as Stage["type"],
    order: r.order,
    priority: r.priority,
    prompt: (r.overrides as any)?.prompt ?? r.phase.prompt,
    meta: (r.overrides as any)?.meta ?? r.phase.meta,
    isEnabled: r.isEnabled,
  }));
}

/** Asegura que existe una Phase por key (o devuelve la ya existente) */
async function ensurePhaseByKey(input: {
  key?: string;
  label: string;
  type: Stage["type"];
  prompt?: string;
  meta?: any;
}) {
  if (input.key) {
    const existing = await prisma.phase.findUnique({ where: { key: input.key } });
    if (existing) return existing;
  }
  // si no hay key o no existe, crea una nueva Phase (si no te gusta crear sin key, añade validación)
  return prisma.phase.create({
    data: {
      key: input.key ?? `phase_${Date.now()}`,
      label: input.label,
      type: input.type,
      prompt: input.prompt ?? "",
      meta: input.meta ?? undefined,
    },
  });
}

/** Guarda el flujo para un VoiceAgent concreto */
export async function saveFlowForAgent(voiceAgentId: string, stages: Stage[]) {
  // 1) Lee los pivots actuales del agente
  const existing = await prisma.agentPhase.findMany({
    where: { agentId: voiceAgentId },
    select: { id: true, phaseId: true },
  });
  const existingByPhase = new Map(existing.map((e) => [e.phaseId, e]));

  // llevaremos control de qué phaseIds se mantienen
  const keptPhaseIds = new Set<string>();

  // 2) Upsert por cada Stage entrante
  for (let i = 0; i < stages.length; i++) {
    const s = stages[i];

    // 2a) Resolver Phase (por id existente o por key)
    let phaseId = s.phaseId;
    if (!phaseId) {
      const phase = await ensurePhaseByKey({
        key: s.key,
        label: s.label,
        type: s.type,
        prompt: s.prompt,
        meta: s.meta,
      });
      phaseId = phase.id;
    }

    keptPhaseIds.add(phaseId);

    // 2b) Upsert del pivot usando la **clave compuesta** (agentId, phaseId)
    await prisma.agentPhase.upsert({
      where: {
        agentId_phaseId: { agentId: voiceAgentId, phaseId }, // 👈 clave compuesta única
      },
      update: {
        order: i,
        priority: s.priority ?? null,
        isEnabled: typeof s.isEnabled === "boolean" ? s.isEnabled : true,
        overrides: {
          // guarda solo overrides; el prompt base vive en Phase
          prompt: s.prompt,
          meta: s.meta ?? undefined,
        },
      },
      create: {
        agentId: voiceAgentId,
        phaseId,
        order: i,
        priority: s.priority ?? null,
        isEnabled: typeof s.isEnabled === "boolean" ? s.isEnabled : true,
        overrides: {
          prompt: s.prompt,
          meta: s.meta ?? undefined,
        },
      },
    });
  }

  // 3) Elimina pivots que ya no estén en el flujo entrante
  await prisma.agentPhase.deleteMany({
    where: {
      agentId: voiceAgentId,
      NOT: { phaseId: { in: Array.from(keptPhaseIds) } },
    },
  });

  // 4) Devuelve el flujo normalizado
  return listStages(voiceAgentId);
}
