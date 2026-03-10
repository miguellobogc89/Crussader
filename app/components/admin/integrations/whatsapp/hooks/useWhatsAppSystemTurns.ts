// app/components/admin/integrations/whatsapp/hooks/useWhatsAppSystemTurns.ts
"use client";

import { useEffect, useMemo, useState } from "react";

export type SystemTurn = { id: string; at: number; text: string; payload?: unknown };

export type SessionMemory = {
  profile?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    reason?: string;
    [k: string]: unknown;
  };
  state?: {
    reason?: string;
    subReason?: string;
    step?: string;
    [k: string]: unknown;
  };
  [k: string]: unknown;
};

async function fetchSystemTurns(args: { companyId: string; conversationId: string; limit?: number }) {
  const params = new URLSearchParams();
  params.set("companyId", args.companyId);
  params.set("conversationId", args.conversationId);
  params.set("limit", String(args.limit ?? 200));

  const res = await fetch(`/api/whatsapp/agent/turns?${params.toString()}`, { cache: "no-store" });
  const data = await res.json().catch(() => null);

  let events: SystemTurn[] = [];
  if (data && data.ok && Array.isArray(data.events)) {
    events = data.events as SystemTurn[];
  }

  let memory: SessionMemory | null = null;
  if (data && data.ok && data.memory && typeof data.memory === "object") {
    memory = data.memory as SessionMemory;
  }

  return { ok: res.ok, events, memory };
}

function buildDisplayName(profile: SessionMemory["profile"] | undefined) {
  let first = "";
  let last = "";

  if (profile && typeof profile.firstName === "string") {
    first = profile.firstName.trim();
  }

  if (profile && typeof profile.lastName === "string") {
    last = profile.lastName.trim();
  }

  const parts: string[] = [];
  if (first.length > 0) parts.push(first);
  if (last.length > 0) parts.push(last);

  return parts.join(" ").trim();
}

function buildMemoryPills(memory: SessionMemory | null): string[] {
  const out: string[] = [];

  if (!memory || typeof memory !== "object") {
    return out;
  }

  const profile =
    memory.profile && typeof memory.profile === "object"
      ? memory.profile
      : undefined;

  const state =
    memory.state && typeof memory.state === "object"
      ? memory.state
      : undefined;

  const displayName = buildDisplayName(profile);
  const email = typeof profile?.email === "string" ? profile.email.trim() : "";
  const phone = typeof profile?.phone === "string" ? profile.phone.trim() : "";

  let reason = "";
  if (typeof state?.reason === "string") {
    reason = state.reason.trim();
  }
  if (reason.length === 0 && typeof profile?.reason === "string") {
    reason = profile.reason.trim();
  }

  const subReason =
    typeof state?.subReason === "string" ? state.subReason.trim() : "";

  const step =
    typeof state?.step === "string" ? state.step.trim() : "";

  const raw: string[] = [];

  if (displayName.length > 0 && displayName !== "Unknown") {
    raw.push(displayName);
  }

  if (email.length > 0) {
    raw.push(email);
  }

  if (phone.length > 0) {
    raw.push(phone);
  }

  if (subReason.length > 0) {
    raw.push("subReason:" + subReason);
  } else if (reason.length > 0) {
    raw.push("reason:" + reason);
  }

  if (step.length > 0) {
    raw.push("step:" + step);
  }

  const unique: string[] = [];

  for (const value of raw) {
    if (!value) continue;
    if (unique.includes(value)) continue;
    unique.push(value);
  }

  return unique;
}

function buildSessionStatus(memory: SessionMemory | null): "IDLE" | "ACTIVE" {
  if (!memory || typeof memory !== "object") {
    return "IDLE";
  }

  const state =
    memory.state && typeof memory.state === "object"
      ? memory.state
      : undefined;

  if (!state) {
    return "IDLE";
  }

  const keys = Object.keys(state).filter((key) => {
    const value = state[key];
    if (value === null || value === undefined) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    return true;
  });

  return keys.length > 0 ? "ACTIVE" : "IDLE";
}

export function useWhatsAppSystemTurns(args: {
  companyId: string | null;
  conversationId: string | null;
  pollMs?: number;
}) {
  const { companyId, conversationId, pollMs = 2000 } = args;

  const [turns, setTurns] = useState<SystemTurn[]>([]);
  const [memory, setMemory] = useState<SessionMemory | null>(null);
  const [loading, setLoading] = useState(false);

  const canFetch = Boolean(companyId) && Boolean(conversationId);

  useEffect(() => {
    if (!companyId) return;

    if (!conversationId) {
      setTurns([]);
      setMemory(null);
      return;
    }

    const cid = companyId;
    const convId = String(conversationId);
    let alive = true;

    async function tick(first: boolean) {
      if (first) setLoading(true);

      try {
        const r = await fetchSystemTurns({
          companyId: cid,
          conversationId: convId,
          limit: 200,
        });

        if (!alive) return;

        if (r.ok) {
          setTurns(r.events);
          setMemory(r.memory);
        } else {
          setTurns([]);
          setMemory(null);
        }
      } finally {
        if (first && alive) {
          setLoading(false);
        }
      }
    }

    tick(true);
    const t = window.setInterval(() => tick(false), pollMs);

    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, [companyId, conversationId, pollMs]);

  const memoryPills = useMemo(() => {
    return buildMemoryPills(memory);
  }, [memory]);

  const sessionStatus = useMemo(() => {
    return buildSessionStatus(memory);
  }, [memory]);

  return { canFetch, turns, memory, memoryPills, sessionStatus, loading };
}