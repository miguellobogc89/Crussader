// lib/crussader-assistant/actions/events/resolveTargetEvent.ts
import { prisma } from "@/lib/prisma";

type ResolveTargetEventInput = {
  conversationId: string;
  eventName?: string;
};

export type ResolveTargetEventResult =
  | { kind: "FOUND_ONE"; eventId: string; status: string; isActive: boolean }
  | { kind: "FOUND_NONE" }
  | { kind: "FOUND_MANY"; events: { id: string; title: string; run_at: Date | null; status: string; isActive: boolean }[] };

export async function resolveTargetEvent(
  input: ResolveTargetEventInput
): Promise<ResolveTargetEventResult> {

  const eventName = input.eventName?.toLowerCase().trim();

  if (!eventName) {
    return { kind: "FOUND_NONE" };
  }

const events = await prisma.agent_event.findMany({
  where: {
    conversation_id: input.conversationId
  },
select: {
  id: true,
  title: true,
  run_at: true,
  status: true,
  is_active: true
}
  });

  const matches = events.filter((e) => {
    if (!e.title) {
      return false;
    }

    return e.title.toLowerCase().includes(eventName);
  });

  if (matches.length === 0) {
    return { kind: "FOUND_NONE" };
  }

if (matches.length === 1) {
  return {
    kind: "FOUND_ONE",
    eventId: matches[0].id,
    status: String(matches[0].status),
    isActive: matches[0].is_active
  };
}

return {
  kind: "FOUND_MANY",
  events: matches.map((event) => ({
    id: event.id,
    title: event.title,
    run_at: event.run_at,
    status: String(event.status),
    isActive: event.is_active
  }))
};
}