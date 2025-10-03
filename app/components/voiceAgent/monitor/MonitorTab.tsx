"use client";

import React from "react";

export default function MonitorTab({ defaultCompanyId }: { defaultCompanyId: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-2">
      <h2 className="text-lg font-medium">Monitorización</h2>
      <p className="text-sm text-slate-500">Logs, métricas y calidad de conversaciones. (placeholder)</p>
      <div className="text-xs text-slate-400">Empresa activa: {defaultCompanyId}</div>
    </div>
  );
}
