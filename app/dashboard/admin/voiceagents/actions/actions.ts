// app/dashboard/admin/voiceagents/actions/actions.ts
"use server";

import { prisma } from "@/lib/prisma";

/** Nombre de la empresa para la cabecera */
export async function loadCompanyMeta(companyId: string) {
  if (!companyId) throw new Error("companyId requerido");
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true, name: true },
  });
  if (!company) return null;
  return { id: company.id, name: company.name };
}

/** Lista de empresas asignables (nombre, asignación actual y #locations + #agentes propios) */
export async function listAssignableCompanies(query?: string) {
  const where = query
    ? { name: { contains: query, mode: "insensitive" as const } }
    : {};

  // 1) Empresas + agente por defecto (si lo hay)
  const companies = await prisma.company.findMany({
    where,
    select: {
      id: true,
      name: true,
      voiceAgentId: true,
      voiceAgent: {
        select: {
          id: true,
          agent: { select: { id: true, name: true, companyId: true } }, // companyId para detectar "externo"
        },
      },
      _count: { select: { Location: true } },
    },
    orderBy: { name: "asc" },
    take: 200,
  });

  // 2) Nº de agentes VOICE creados por cada empresa (propios)
  const grouped = await prisma.agent.groupBy({
    by: ["companyId"],
    where: { channel: "VOICE" },
    _count: { _all: true },
  });
  const ownedCountByCompany: Record<string, number> = Object.fromEntries(
    grouped.map((g) => [g.companyId, g._count._all])
  );

  // 3) Ensamblar salida
  return companies.map((c) => {
    const assignedName = c.voiceAgent?.agent?.name ?? null;
    const assignedExternal = c.voiceAgent
      ? c.voiceAgent.agent.companyId !== c.id
      : false;

    return {
      id: c.id,
      name: c.name,
      locationsCount: c._count.Location,
      // default asignado (puede ser de otra empresa)
      assignedVoiceAgentId: c.voiceAgentId ?? null,
      assignedVoiceAgentName: assignedName,
      assignedVoiceAgentExternal: assignedExternal,
      // agentes creados por esta empresa
      ownedVoiceAgentsCount: ownedCountByCompany[c.id] ?? 0,
    };
  });
}


/** Todos los voice agents disponibles + nº compañías */
export async function listAllVoiceAgentsForAssignment() {
  const vas = await prisma.voiceAgent.findMany({
    select: {
      id: true,
      agent: { select: { id: true, name: true, status: true, channel: true } },
      _count: { select: { companies: true } },
    },
    orderBy: { agent: { name: "asc" } },
  });

  return vas.map((v) => ({
    voiceAgentId: v.id,
    agentId: v.agent.id,
    name: v.agent.name,
    status: v.agent.status as "ACTIVE" | "PAUSED" | "DISABLED",
    channel: v.agent.channel as "VOICE" | "CHAT",
    companiesCount: v._count.companies,
  }));
}

/** Asignar / desasignar un voice agent a una compañía */
export async function setCompanyVoiceAgent(companyId: string, voiceAgentId: string | null) {
  if (!companyId) throw new Error("companyId requerido");
  await prisma.company.update({
    where: { id: companyId },
    data: { voiceAgentId },
    select: { id: true },
  });
  return { ok: true };
}

/** Resumen de calendario (ubicaciones/servicios) */
export async function getCompanyCalendarSummary(companyId: string) {
  if (!companyId) throw new Error("companyId requerido");
  const [locationsCount, servicesCount] = await Promise.all([
    prisma.location.count({ where: { companyId } }),
    prisma.service.count({ where: { location: { companyId } } }),
  ]);
  return { locationsCount, servicesCount };
}

// === LISTA DE AGENTES DE UNA EMPRESA (incluye el asignado por defecto, aunque sea externo) ===
export async function listCompanyVoiceAgents(companyId: string) {
  if (!companyId) return [];

  // Empresa + agente asignado por defecto
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      voiceAgentId: true,
      voiceAgent: {
        select: {
          id: true,
          agent: {
            select: {
              id: true,
              name: true,
              status: true,
              createdAt: true,
              companyId: true,
            },
          },
          _count: { select: { phases: true } },
        },
      },
    },
  });

  // Agentes PROPIOS de la empresa (VOICE)
  const owned = await prisma.voiceAgent.findMany({
    where: { agent: { companyId, channel: "VOICE" } },
    select: {
      id: true,
      agent: {
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
        },
      },
      _count: { select: { phases: true } },
    },
    orderBy: { agent: { name: "asc" } },
  });

  const ownedRows = owned.map((v) => ({
    voiceAgentId: v.id,
    agentId: v.agent.id,
    name: v.agent.name,
    status: v.agent.status as "ACTIVE" | "PAUSED" | "DISABLED",
    createdAt: v.agent.createdAt.toISOString(),
    phasesCount: v._count.phases,
    isAssignedDefault: company?.voiceAgentId === v.id,
    isExternalAssigned: false,
  }));

  // Si hay agente asignado y NO es propio, inclúyelo (marcado como externo)
  const rows = [...ownedRows];
  const assigned = company?.voiceAgent;
  if (assigned && !ownedRows.find((r) => r.voiceAgentId === assigned.id)) {
    rows.unshift({
      voiceAgentId: assigned.id,
      agentId: assigned.agent.id,
      name: assigned.agent.name,
      status: assigned.agent.status as "ACTIVE" | "PAUSED" | "DISABLED",
      createdAt: assigned.agent.createdAt.toISOString(),
      phasesCount: assigned._count.phases,
      isAssignedDefault: true,
      isExternalAssigned: assigned.agent.companyId !== companyId,
    });
  }

  return rows;
}


/** === CREAR agente VOICE para una empresa === */
export async function createVoiceAgentForCompany(input: {
  companyId: string;
  name: string;
  language?: string;           // ej "es-ES"
  defaultModel?: string;       // opcional
  voiceName?: string;          // opcional
}) {
  const { companyId, name, language = "es-ES", defaultModel, voiceName } = input;
  if (!companyId || !name?.trim()) throw new Error("companyId y name requeridos");

  // 1) crea Agent base
  const agent = await prisma.agent.create({
    data: {
      companyId,
      name: name.trim(),
      channel: "VOICE",
      status: "ACTIVE",
    },
    select: { id: true },
  });

  // 2) crea VoiceAgent
  const va = await prisma.voiceAgent.create({
    data: {
      agentId: agent.id,
      defaultModel: defaultModel ?? null,
      voiceName: voiceName ?? null,
      language,
    },
    select: { id: true },
  });

  return { ok: true, voiceAgentId: va.id, agentId: agent.id };
}

/** === LISTAR ubicaciones de una empresa === */
export async function listCompanyLocations(companyId: string) {
  if (!companyId) throw new Error("companyId requerido");

  const locs = await prisma.location.findMany({
    where: { companyId },
    select: { id: true, title: true, city: true, region: true },
    orderBy: [{ city: "asc" }, { title: "asc" }],
    take: 1000,
  });

  // A falta de override por Location (Prisma), devolvemos la lista “plana”
  return locs.map((l) => ({
    id: l.id,
    title: l.title,
    city: l.city,
    region: l.region,
    hasOverride: false, // cuando actualices Prisma podrás calcularlo
  }));
}

/** === ASIGNAR agente a ubicaciones (pendiente de Prisma) === */
export async function assignVoiceAgentToLocations(voiceAgentId: string, locationIds: string[]) {
  if (!voiceAgentId || !Array.isArray(locationIds) || locationIds.length === 0) {
    throw new Error("voiceAgentId y locationIds requeridos");
  }
  // ⚠️ Bloquea hasta que actualices Prisma
  // Opción A: añadir Location.voiceAgentId (nullable) → updateMany
  // Opción B: pivot Agent↔Location con unicidad por locationId, channel=VOICE
  throw new Error("Necesito actualizar Prisma: añade override por Location (voiceAgentId o pivot).");
}

/** === DESASIGNAR agente de ubicaciones (pendiente de Prisma) === */
export async function unassignVoiceAgentFromLocations(voiceAgentId: string, locationIds: string[]) {
  if (!voiceAgentId || !Array.isArray(locationIds) || locationIds.length === 0) {
    throw new Error("voiceAgentId y locationIds requeridos");
  }
  // ⚠️ Bloquea hasta que actualices Prisma
  throw new Error("Necesito actualizar Prisma: añade override por Location (voiceAgentId o pivot).");
}

