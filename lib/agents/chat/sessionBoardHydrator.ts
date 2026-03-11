// lib/agents/chat/sessionBoardHydrator.ts
import { prisma } from "@/lib/prisma";

export type SessionBoard = {
  company: {
    id: string;
    name: string | null;
    locations: Array<{
      id: string;
      title: string | null;
      address: string | null;
      city: string | null;
      region: string | null;
      country: string | null;
      postalCode: string | null;
      timezone: string | null;
      phone: string | null;
      website: string | null;
      openingHours: unknown | null;
    }>;
  };

  knowledge: {
    sections: Array<{
      id: string;
      title: string | null;
      slug: string | null;
      content: string | null;
      visibility: string | null;
      position: number | null;
      updatedAt: string | null;
    }>;
  };

  customer?: {
    name?: string | null;
    phone?: string | null;
  };

  state?: Record<string, unknown>;
};

function toNullableString(v: unknown): string | null {
  const s = String(v || "").trim();
  if (!s) return null;
  return s;
}

function toNullableNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return null;
}

export async function hydrateSessionBoard(args: {
  sessionId: string;
  companyId: string;
}): Promise<SessionBoard> {
  const sessionId = String(args.sessionId || "").trim();
  const companyId = String(args.companyId || "").trim();
  if (!sessionId) throw new Error("Missing sessionId");
  if (!companyId) throw new Error("Missing companyId");

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      name: true,
      Location: {
        select: {
          id: true,
          title: true,
          address: true,
          city: true,
          region: true,
          country: true,
          postalCode: true,
          timezone: true,
          phone: true,
          website: true,
          openingHours: true,
        },
        orderBy: [{ createdAt: "asc" }],
        take: 10,
      },
    },
  });

  if (!company) throw new Error(`Company not found: ${companyId}`);

  const knowledgeSections = await prisma.knowledgeSection.findMany({
    where: {
      companyId,
      isActive: true,
      visibility: "PUBLIC",
    },
    orderBy: [{ position: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      content: true,
      visibility: true,
      position: true,
      updatedAt: true,
    },
    take: 30,
  });

  const board: SessionBoard = {
    company: {
      id: company.id,
      name: toNullableString(company.name),
      locations: (company.Location || []).map((l) => ({
        id: l.id,
        title: toNullableString(l.title),
        address: toNullableString(l.address),
        city: toNullableString(l.city),
        region: toNullableString(l.region),
        country: toNullableString(l.country),
        postalCode: toNullableString(l.postalCode),
        timezone: toNullableString(l.timezone),
        phone: toNullableString(l.phone),
        website: toNullableString(l.website),
        openingHours: l.openingHours ?? null,
      })),
    },

    knowledge: {
      sections: (knowledgeSections || []).map((s) => ({
        id: s.id,
        title: toNullableString(s.title),
        slug: toNullableString(s.slug),
        content: toNullableString(s.content),
        visibility: toNullableString(s.visibility),
        position: toNullableNumber(s.position),
        updatedAt: s.updatedAt ? s.updatedAt.toISOString() : null,
      })),
    },
  };

  const session = await prisma.agentSession.findUnique({
    where: { id: sessionId },
    select: { settings: true },
  });

  const prev = (session?.settings ?? null) as any;
  const nextSettings: any = {};

  if (prev && typeof prev === "object") {
    for (const k of Object.keys(prev)) {
      nextSettings[k] = prev[k];
    }
  }

  nextSettings.board = board;

  await prisma.agentSession.update({
    where: { id: sessionId },
    data: {
      settings: nextSettings,
      updatedAt: new Date(),
    },
    select: { id: true },
  });

  return board;
}

export async function readSessionBoard(sessionId: string): Promise<SessionBoard | null> {
  const id = String(sessionId || "").trim();
  if (!id) throw new Error("Missing sessionId");

  const s = await prisma.agentSession.findUnique({
    where: { id },
    select: { settings: true },
  });

  const st = (s?.settings ?? null) as any;
  if (!st || typeof st !== "object") return null;

  const b = st.board;
  if (!b || typeof b !== "object") return null;

  return b as SessionBoard;
}

export type StageResult = {
  done: boolean;
  missing: string[];
  board_patch?: Record<string, unknown>;
  side_effects?: Array<Record<string, unknown>>;
};

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function deepMerge(target: Record<string, unknown>, patch: Record<string, unknown>) {
  for (const k of Object.keys(patch)) {
    const pv = patch[k];
    const tv = target[k];

    if (isPlainObject(tv) && isPlainObject(pv)) {
      deepMerge(tv, pv);
    } else {
      target[k] = pv as any;
    }
  }
}

export async function patchSessionBoard(args: {
  sessionId: string;
  patch: Record<string, unknown>;
}): Promise<SessionBoard | null> {
  const sessionId = String(args.sessionId || "").trim();
  if (!sessionId) throw new Error("Missing sessionId");

  const s = await prisma.agentSession.findUnique({
    where: { id: sessionId },
    select: { settings: true },
  });

  const prev = (s?.settings ?? null) as any;
  const nextSettings: any = {};

  if (prev && typeof prev === "object") {
    for (const k of Object.keys(prev)) {
      nextSettings[k] = prev[k];
    }
  }

  const prevBoard = isPlainObject(nextSettings.board) ? (nextSettings.board as any) : null;
  const mergedBoard: any = prevBoard ? { ...prevBoard } : {};

  if (isPlainObject(args.patch)) {
    deepMerge(mergedBoard, args.patch);
  }

  nextSettings.board = mergedBoard;

  await prisma.agentSession.update({
    where: { id: sessionId },
    data: { settings: nextSettings, updatedAt: new Date() },
    select: { id: true },
  });

  return mergedBoard as SessionBoard;
}

export async function readSessionSettings(sessionId: string): Promise<any | null> {
  const id = String(sessionId || "").trim();
  if (!id) throw new Error("Missing sessionId");

  const s = await prisma.agentSession.findUnique({
    where: { id },
    select: { settings: true },
  });

  return (s?.settings ?? null) as any;
}