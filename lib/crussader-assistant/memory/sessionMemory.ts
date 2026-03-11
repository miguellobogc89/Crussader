// lib/crussader-assistant/memory/sessionMemory.ts
import { prisma } from "@/lib/prisma";

type MemoryBucket = Record<string, unknown>;

type SessionMemory = {
  profile: MemoryBucket;
  state: MemoryBucket;
};

function asObject(value: unknown): Record<string, unknown> {
  if (!value) {
    return {};
  }

  if (typeof value !== "object") {
    return {};
  }

  if (Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

export async function getAssistantSessionMemory(
  sessionId: string
): Promise<SessionMemory> {
  const cleanSessionId = String(sessionId || "").trim();

  if (!cleanSessionId) {
    throw new Error("Missing sessionId");
  }

  const session = await prisma.agentSession.findUnique({
    where: { id: cleanSessionId },
    select: { settings: true },
  });

  const settings = asObject(session?.settings);
  const memory = asObject(settings.memory);
  const profile = asObject(memory.profile);
  const state = asObject(memory.state);

  return {
    profile,
    state,
  };
}

export async function updateAssistantSessionMemory(args: {
  sessionId: string;
  bucket: "profile" | "state";
  patch: Record<string, unknown>;
}) {
  const cleanSessionId = String(args.sessionId || "").trim();

  if (!cleanSessionId) {
    throw new Error("Missing sessionId");
  }

  const session = await prisma.agentSession.findUnique({
    where: { id: cleanSessionId },
    select: { settings: true },
  });

  const settings = asObject(session?.settings);
  const memory = asObject(settings.memory);

  const nextProfile = asObject(memory.profile);
  const nextState = asObject(memory.state);

  if (args.bucket === "profile") {
    Object.assign(nextProfile, args.patch);
  }

  if (args.bucket === "state") {
    Object.assign(nextState, args.patch);
  }

  const nextSettings = {
    ...settings,
    memory: {
      profile: nextProfile,
      state: nextState,
    },
  };

  await prisma.agentSession.update({
    where: { id: cleanSessionId },
    data: {
      settings: nextSettings,
      updatedAt: new Date(),
    },
  });
}

export async function clearAssistantSessionState(sessionId: string) {
  const cleanSessionId = String(sessionId || "").trim();

  if (!cleanSessionId) {
    throw new Error("Missing sessionId");
  }

  const session = await prisma.agentSession.findUnique({
    where: { id: cleanSessionId },
    select: { settings: true },
  });

  const settings = asObject(session?.settings);
  const memory = asObject(settings.memory);
  const profile = asObject(memory.profile);

  const nextSettings = {
    ...settings,
    memory: {
      profile,
      state: {},
    },
  };

  await prisma.agentSession.update({
    where: { id: cleanSessionId },
    data: {
      settings: nextSettings,
      updatedAt: new Date(),
    },
  });
}