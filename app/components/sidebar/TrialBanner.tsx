"use client";

import { useEffect, useMemo, useState } from "react";

type TrialInfo = {
  trialStartAt: string | null; // ISO
  trialEndAt: string | null;   // ISO
};

export default function TrialBanner({ collapsed = false }: { collapsed?: boolean }) {
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<TrialInfo | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/account/trial-info", { cache: "no-store" });
        if (!res.ok) throw new Error("no trial");
        const data = (await res.json()) as TrialInfo;
        if (alive) setInfo(data);
      } catch {
        if (alive) setInfo(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Derivados
  const { daysLeft, totalDays, pct, ended } = useMemo(() => {
    if (!info?.trialStartAt || !info?.trialEndAt) {
      return { daysLeft: 0, totalDays: 0, pct: 0, ended: false };
    }
    const now = Date.now();
    const start = new Date(info.trialStartAt).getTime();
    const end = new Date(info.trialEndAt).getTime();

    const total = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    const left = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
    const finished = now >= end;
    const p = Math.min(100, Math.max(0, ((total - left) / total) * 100));

    return { daysLeft: left, totalDays: total, pct: p, ended: finished };
  }, [info?.trialStartAt, info?.trialEndAt]);

  if (loading) return null;            // no parpadeos
  if (!info) return null;              // sin prueba activa, no mostramos nada

  return (
    <div className="px-2 pb-2">
      <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 shadow-inner">
        {!collapsed && (
          <div className="mb-2 flex items-center justify-between text-[12px]">
            <span className="font-medium text-slate-200">
              {ended ? "Prueba finalizada" : "Prueba en curso"}
            </span>
            <span className="text-slate-400">
              {ended ? "0 días" : `${daysLeft} ${daysLeft === 1 ? "día" : "días"} restantes`}
            </span>
          </div>
        )}

        {/* Barra “neón” */}
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-800/60">
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              background:
                "linear-gradient(90deg, #22d3ee 0%, #22c55e 45%, #8b5cf6 100%)",
              boxShadow:
                "0 0 8px rgba(34,211,238,.6), 0 0 14px rgba(139,92,246,.5), inset 0 0 6px rgba(255,255,255,.1)",
              transition: "width .6s ease",
            }}
          />
          {/* Glow externo suave */}
          <div className="pointer-events-none absolute inset-0 blur-[6px]" style={{
            background:
              "linear-gradient(90deg, rgba(34,211,238,.25) 0%, rgba(34,197,94,.25) 45%, rgba(139,92,246,.25) 100%)",
            opacity: 0.7,
          }}/>
        </div>

        {!collapsed && (
          <div className="mt-2 text-[11px] text-slate-400">
            {ended
              ? "Activa un plan para seguir usando la app."
              : `Día ${Math.max(1, totalDays - daysLeft)} de ${totalDays}`}
          </div>
        )}
      </div>
    </div>
  );
}
