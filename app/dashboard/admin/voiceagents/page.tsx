// app/dashboard/admin/voiceagents/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { loadCompanyMeta } from "./actions/actions"; // server action (cabecera)

type TabKey = "constructor" | "tel" | "assign" | "monitor";

const MENU: Array<{ key: TabKey; name: string; href: string }> = [
  { key: "constructor", name: "Constructor",     href: "/dashboard/admin/voiceagents" },
  { key: "tel",         name: "Telefonía",       href: "/dashboard/admin/voiceagents?tab=tel" },
  { key: "assign",      name: "Asignación",      href: "/dashboard/admin/voiceagents?tab=assign" },
  { key: "monitor",     name: "Monitorización",  href: "/dashboard/admin/voiceagents?tab=monitor" },
];

// Dynamic imports (un componente por pestaña)
const ConstructorTab = dynamic(
  () => import("@/app/components/voiceAgent/constructor/ConstructorTab").then(m => m.default),
  { ssr: false, loading: () => <div className="rounded-2xl border bg-white p-6 shadow-sm text-sm text-slate-500">Cargando constructor…</div> }
);

const OrgAgentAssignment = dynamic(
  () => import("@/app/components/voiceAgent/assign/OrgAgentAssignment").then(m => m.default),
  { ssr: false, loading: () => <div className="rounded-2xl border bg-white p-6 shadow-sm text-sm text-slate-500">Cargando asignación…</div> }
);

const TelephonyTab = dynamic(
  () => import("@/app/components/voiceAgent/tel/TelephonyTab").then(m => m.default),
  { ssr: false, loading: () => <div className="rounded-2xl border bg-white p-6 shadow-sm text-sm text-slate-500">Cargando telefonía…</div> }
);

const MonitorTab = dynamic(
  () => import("@/app/components/voiceAgent/monitor/MonitorTab").then(m => m.default),
  { ssr: false, loading: () => <div className="rounded-2xl border bg-white p-6 shadow-sm text-sm text-slate-500">Cargando monitorización…</div> }
);

export default function VoiceAgentAdminPage() {
  // En tu proyecto este ID lo tendrás del contexto/org actual
  const [companyId] = useState<string>("cmfmxqxqx0000i5i4ph2bb3ij");
  const [companyName, setCompanyName] = useState<string>("—");

  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") ?? "constructor") as TabKey;

  useEffect(() => {
    (async () => {
      const meta = await loadCompanyMeta(companyId);
      setCompanyName(meta?.name ?? "—");
    })();
  }, [companyId]);

  return (
    <div className="min-h-[calc(100vh-2rem)] w-full bg-gradient-to-br from-slate-50 to-slate-100 p-4 text-slate-900 md:p-6">
      <div className="mx-auto max-w-[1400px] space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Constructor Agentes IA</h1>
            <div className="text-sm text-slate-500">
              Empresa: <span className="font-medium text-slate-900">{companyName}</span>
            </div>
          </div>
          <nav className="mt-2 flex gap-4 border-b border-slate-200">
            {MENU.map((m) => {
              const current = m.key === tab;
              return (
                <Link
                  key={m.name}
                  href={m.href}
                  className={[
                    "inline-flex items-center gap-2 py-2 text-sm",
                    current ? "font-medium text-slate-900 border-b-2 border-slate-900" : "text-slate-500 hover:text-slate-900",
                  ].join(" ")}
                >
                  {m.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Tabs */}
        {tab === "constructor" && <ConstructorTab defaultCompanyId={companyId} />}
        {tab === "tel"         && <TelephonyTab defaultCompanyId={companyId} />}
        {tab === "assign"      && <OrgAgentAssignment defaultCompanyId={companyId} />}
        {tab === "monitor"     && <MonitorTab defaultCompanyId={companyId} />}
      </div>
    </div>
  );
}
