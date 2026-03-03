// lib/agents/memory/updateSessionMemory.ts
import { prisma } from "@/lib/prisma";

type MemoryBucket = "profile" | "state";

export async function updateSessionMemory(args: {
  sessionId: string;
  patch: Record<string, unknown>;
  bucket?: MemoryBucket; // default: "profile"
}): Promise<void> {
  const sessionId = String(args.sessionId || "").trim();
  if (!sessionId) throw new Error("Missing sessionId");

  const bucket: MemoryBucket = args.bucket === "state" ? "state" : "profile";
  const patch = args.patch || {};

  const session = await prisma.agentSession.findUnique({
    where: { id: sessionId },
    select: { settings: true },
  });

  const prevSettings = session?.settings;
  const nextSettings: any = {};

  if (prevSettings && typeof prevSettings === "object") {
    Object.assign(nextSettings, prevSettings);
  }

  const nextMemory: any = {};
  if (nextSettings.memory && typeof nextSettings.memory === "object") {
    Object.assign(nextMemory, nextSettings.memory);
  }

  const bucketObj: any = {};
  if (nextMemory[bucket] && typeof nextMemory[bucket] === "object") {
    Object.assign(bucketObj, nextMemory[bucket]);
  }

  for (const key of Object.keys(patch)) {
    bucketObj[key] = patch[key];
  }

  nextMemory[bucket] = bucketObj;
  nextSettings.memory = nextMemory;

  await prisma.agentSession.update({
    where: { id: sessionId },
    data: {
      settings: nextSettings,
      updatedAt: new Date(),
    },
    select: { id: true },
  });
}

export async function clearSessionStateMemory(args: {
  sessionId: string;
}): Promise<void> {
  const sessionId = String(args.sessionId || "").trim();
  if (!sessionId) throw new Error("Missing sessionId");

  const session = await prisma.agentSession.findUnique({
    where: { id: sessionId },
    select: { settings: true },
  });

  const prevSettings = session?.settings;
  const nextSettings: any = {};

  if (prevSettings && typeof prevSettings === "object") {
    Object.assign(nextSettings, prevSettings);
  }

  const nextMemory: any = {};
  if (nextSettings.memory && typeof nextSettings.memory === "object") {
    Object.assign(nextMemory, nextSettings.memory);
  }

  nextMemory.state = {};
  nextSettings.memory = nextMemory;

  await prisma.agentSession.update({
    where: { id: sessionId },
    data: {
      settings: nextSettings,
      updatedAt: new Date(),
    },
    select: { id: true },
  });
}