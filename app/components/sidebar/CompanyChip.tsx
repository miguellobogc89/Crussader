"use client";

import { ChevronsUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useBootstrapData } from "@/app/providers/bootstrap-store";

export function CompanyChip({ collapsed }: { collapsed: boolean }) {
  const router = useRouter();
  const boot = useBootstrapData();
  const activeCompany = boot?.activeCompany ?? null;
  const companies = boot?.companies ?? [];
  const moreThanOneCompany = (companies?.length ?? 0) > 1;

  if (collapsed) return null;

  return (
    <div className="px-3 pb-3">
      <div className="flex items-center justify-between rounded-md bg-slate-800/50 px-2 py-2">
        <div className="min-w-0">
          <div className="text-[11px] text-slate-400 leading-none">Empresa</div>
          <div className="truncate text-sm font-medium text-white">
            {activeCompany?.name ?? "—"}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!moreThanOneCompany) return;
            // ✅ Ruta segura existente: abre el selector en la página de Empresa
            router.push("/dashboard/company?modal=switch");
          }}
          disabled={!moreThanOneCompany}
          title={moreThanOneCompany ? "Cambiar de empresa" : "Solo tienes una empresa"}
          className={[
            "ml-2 inline-flex h-8 w-8 flex-none items-center justify-center rounded-md transition",
            moreThanOneCompany
              ? "text-slate-200 hover:text-white hover:bg-slate-700/70"
              : "text-slate-500 bg-slate-800 cursor-not-allowed opacity-60",
          ].join(" ")}
          aria-disabled={!moreThanOneCompany}
        >
          <ChevronsUpDown className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
