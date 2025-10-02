// /app/dashboard/voiceagent/actions/actions.ts

// ⚠️ Importante: nada de `import { prisma } from "@/lib/prisma"` en top-level.
// Cada función declara "use server" y hace el import dinámico de prisma.

export async function loadCompanyMeta(companyId: string) {
  "use server";
  if (!companyId) throw new Error("companyId requerido");
  const { prisma } = await import("@/lib/prisma");

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true, name: true },
  });
  if (!company) return null;
  return { id: company.id, name: company.name };
}

/** Lista de empresas asignables (nombre, asignación actual y #locations) */
export async function listAssignableCompanies(query?: string) {
  "use server";
  const { prisma } = await import("@/lib/prisma");

  const where = query ? { name: { contains: query, mode: "insensitive" as const } } : {};

  const companies = await prisma.company.findMany({
    where,
    select: {
      id: true,
      name: true,
      voiceAgentId: true,
      voiceAgent: { select: { id: true, agent: { select: { name: true } } } },
      _count: { select: { Location: true } },
    },
    orderBy: { name: "asc" },
    take: 200,
  });

  return companies.map((c) => ({
    id: c.id,
    name: c.name,
    locationsCount: c._count.Location,
    assignedVoiceAgentId: c.voiceAgentId ?? null,
    assignedVoiceAgentName: c.voiceAgent?.agent?.name ?? null,
  }));
}

/** Todos los voice agents disponibles + en cuántas compañías están asignados */
export async function listAllVoiceAgentsForAssignment() {
  "use server";
  const { prisma } = await import("@/lib/prisma");

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

/** Asignar / desasignar un voice agent a una compañía (Company.voiceAgentId) */
export async function setCompanyVoiceAgent(companyId: string, voiceAgentId: string | null) {
  "use server";
  if (!companyId) throw new Error("companyId requerido");
  const { prisma } = await import("@/lib/prisma");

  await prisma.company.update({
    where: { id: companyId },
    data: { voiceAgentId },
    select: { id: true },
  });
  return { ok: true };
}

/** Resumen de calendarios para mostrar “acceso a ubicaciones/servicios” */
export async function getCompanyCalendarSummary(companyId: string) {
  "use server";
  if (!companyId) throw new Error("companyId requerido");
  const { prisma } = await import("@/lib/prisma");

  const [locationsCount, servicesCount] = await Promise.all([
    prisma.location.count({ where: { companyId } }),
    prisma.service.count({ where: { location: { companyId } } }),
  ]);

  return { locationsCount, servicesCount };
}
