// app/components/onboarding/steps/CompanyLocationSummaryStep.tsx
"use client";

import * as React from "react";
import type { OnboardingStepProps } from "@/app/components/onboarding/steps";

export function CompanyLocationSummaryStep({
  state,
}: OnboardingStepProps) {
  const companyName =
    state.companyForm.name?.trim() || "Empresa sin nombre";
  const locationTitle =
    state.locationForm.title?.trim() || "Establecimiento sin nombre";

  return (
    <div className="space-y-5 text-slate-700">
      <p className="text-sm leading-relaxed">
        Hemos creado tu{" "}
        <span className="font-semibold">empresa</span> y tu{" "}
        <span className="font-semibold">primer establecimiento</span> en
        Crussader.
      </p>

      <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-3">
        {/* Empresa */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center rounded-md bg-white shadow-sm border border-slate-200">
            <img
              src="img/icon/company.png"
              alt="Empresa"
              className="h-7 w-7 object-contain"
            />
          </div>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Empresa
            </p>
            <p className="text-sm font-semibold text-slate-900">
              {companyName}
            </p>
          </div>
        </div>

        {/* Establecimiento */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center rounded-md bg-white shadow-sm border border-slate-200">
            <img
              src="/img/icon/location.png"
              alt="Establecimiento"
              className="h-7 w-7 object-contain"
            />
          </div>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Establecimiento
            </p>
            <p className="text-sm font-semibold text-slate-900">
              {locationTitle}
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Si detectas algún error en estos datos, podrás ajustarlos más adelante
        desde el panel de{" "}
        <span className="font-semibold">Empresa y ubicaciones</span>.
      </p>

      <p className="text-xs text-slate-500">
        Pulsa <span className="font-semibold">Siguiente</span> para continuar
        con la conexión a Google.
      </p>
    </div>
  );
}
