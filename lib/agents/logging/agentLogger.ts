//lib/agents/logging/agentLogger.ts
import { prisma } from "@/lib/prisma";

type Level = "DEBUG" | "INFO" | "WARN" | "ERROR";

export async function logAgentEvent(args: {
  sessionId: string;
  level: Level;
  message: string;
  payload?: Record<string, unknown> | null;
}) {
  const sessionId = String(args.sessionId || "").trim();
  if (!sessionId) return;

  await prisma.agentLog.create({
    data: {
      sessionId,
      level: args.level,
      message: args.message,
      payload: (args.payload ?? null) as any,
    },
    select: { id: true },
  });
}