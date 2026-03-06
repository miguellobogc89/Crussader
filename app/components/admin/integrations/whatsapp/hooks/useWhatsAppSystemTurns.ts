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

function buildReasonPill(memory: SessionMemory | null): string {
  if (!memory || typeof memory !== "object") {
    return "";
  }

  const profile =
    memory.profile && typeof memory.profile === "object"
      ? memory.profile
      : undefined;

  const state =
    memory.state && typeof memory.state === "object"
      ? memory.state
      : undefined;

  let reason = "";

  if (profile && typeof profile.reason === "string") {
    reason = profile.reason.trim();
  }

  if (reason.length === 0 && state && typeof state.reason === "string") {
    reason = state.reason.trim();
  }

  if (reason.length === 0) {
    return "";
  }

  return "reason: " + reason;
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

  const displayName = buildDisplayName(profile);
  const email = typeof profile?.email === "string" ? profile.email.trim() : "";
  const phone = typeof profile?.phone === "string" ? profile.phone.trim() : "";
  const reasonPill = buildReasonPill(memory);

  const raw: string[] = [];

  if (displayName.length > 0) raw.push(displayName);
  if (email.length > 0) raw.push(email);
  if (phone.length > 0) raw.push(phone);
  if (reasonPill.length > 0) raw.push(reasonPill);

  const unique: string[] = [];

  for (const value of raw) {
    if (value.length === 0) continue;
    if (value === "Unknown") continue;
    if (unique.includes(value)) continue;
    unique.push(value);
  }

  return unique;
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

  return { canFetch, turns, memory, memoryPills, loading };
}