// lib/agents/memory/getSessionMemory.ts
import { prisma } from "@/lib/prisma";

type SessionMemoryBucket = Record<string, unknown>;

export async function getSessionMemory(sessionId: string): Promise<{
  profile: SessionMemoryBucket;
  state: SessionMemoryBucket;
}> {
  const id = String(sessionId || "").trim();
  if (!id) throw new Error("Missing sessionId");

  const session = await prisma.agentSession.findUnique({
    where: { id },
    select: { settings: true },
  });

  const settings =
    session && session.settings && typeof session.settings === "object"
      ? (session.settings as Record<string, unknown>)
      : {};

  const memoryRaw =
    settings.memory && typeof settings.memory === "object"
      ? (settings.memory as Record<string, unknown>)
      : {};

  const profile =
    memoryRaw.profile && typeof memoryRaw.profile === "object"
      ? (memoryRaw.profile as SessionMemoryBucket)
      : {};

  const state =
    memoryRaw.state && typeof memoryRaw.state === "object"
      ? (memoryRaw.state as SessionMemoryBucket)
      : {};

  return {
    profile,
    state,
  };
}