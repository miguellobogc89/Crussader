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
    [k: string]: unknown;
  };
  state?: Record<string, unknown>;
  [k: string]: unknown;
};

async function fetchSystemTurns(args: { companyId: string; conversationId: string; limit?: number }) {
  const params = new URLSearchParams();
  params.set("companyId", args.companyId);
  params.set("conversationId", args.conversationId);
  params.set("limit", String(args.limit ?? 200));

  const res = await fetch(`/api/whatsapp/agent/turns?${params.toString()}`, { cache: "no-store" });
  const data = await res.json().catch(() => null);

  const events: SystemTurn[] =
    data && data.ok && Array.isArray(data.events) ? (data.events as SystemTurn[]) : [];

  const memory: SessionMemory | null =
    data && data.ok && data.memory && typeof data.memory === "object" ? (data.memory as SessionMemory) : null;

  return { ok: res.ok, events, memory };
}

function buildDisplayName(profile: SessionMemory["profile"] | undefined) {
  const first = profile && typeof profile.firstName === "string" ? profile.firstName.trim() : "";
  const last = profile && typeof profile.lastName === "string" ? profile.lastName.trim() : "";

  const parts: string[] = [];
  if (first.length > 0) parts.push(first);
  if (last.length > 0) parts.push(last);

  return parts.join(" ").trim();
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
        const r = await fetchSystemTurns({ companyId: cid, conversationId: convId, limit: 200 });
        if (!alive) return;

        if (r.ok) {
          setTurns(r.events);
          setMemory(r.memory);
        } else {
          setTurns([]);
          setMemory(null);
        }
      } finally {
        if (first && alive) setLoading(false);
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
    const out: string[] = [];
    if (!memory) return out;

    const profile = memory.profile && typeof memory.profile === "object" ? memory.profile : undefined;

    const displayName = buildDisplayName(profile);
    const email = profile && typeof profile.email === "string" ? profile.email.trim() : "";
    const phone = profile && typeof profile.phone === "string" ? profile.phone.trim() : "";

    if (displayName.length > 0) out.push(displayName);
    if (email.length > 0) out.push(email);
    if (phone.length > 0) out.push(phone);

    return out;
  }, [memory]);

  return { canFetch, turns, memory, memoryPills, loading };
}