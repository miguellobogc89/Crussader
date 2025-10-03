"use client";

import React from "react";

export default function TelephonyTab({ defaultCompanyId }: { defaultCompanyId: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-2">
      <h2 className="text-lg font-medium">Telefonía</h2>
      <p className="text-sm text-slate-500">Configura números, proveedores y rutas de llamadas. (placeholder)</p>
      <div className="text-xs text-slate-400">Empresa activa: {defaultCompanyId}</div>
    </div>
  );
}
