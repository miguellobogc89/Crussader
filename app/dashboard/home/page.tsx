// app/dashboard/home/page.tsx
"use client";

import * as React from "react";
import { Hammer } from "lucide-react";

import WelcomePanel from "@/app/components/home/WelcomePanel";
import CompanyKpiRow from "@/app/components/company/cards/CompanyKpiRow";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";

/* ----------------------- helpers (fetchers) ----------------------- */

type CompanyRow = { id: string; name: string; role: string; createdAt: string };

async function fetchMyCompanies(): Promise<CompanyRow[]> {
  const r = await fetch("/api/companies", { cache: "no-store" });
  if (!r.ok) return [];
  const j = await r.json();
  return Array.isArray(j?.companies) ? j.companies : [];
}

type CompanyDetails = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  employeesBand?: string | null;
};

async function fetchCompanyDetails(
  companyId: string,
): Promise<CompanyDetails | null> {
  try {
    const r = await fetch(`/api/companies/${companyId}`, { cache: "no-store" });
    if (!r.ok) return null;
    const j = await r.json();
    return j?.company ?? null;
  } catch {
    return null;
  }
}

/* ----------------------- page ----------------------- */

export default function DashboardHomePage() {
  // luego lo sustituyes por session.user.name
  const name = "Miguel";

  const [loading, setLoading] = React.useState(true);
  const [companyId, setCompanyId] = React.useState<string | null>(null);
  const [companyName, setCompanyName] = React.useState("Tu empresa");
  const [details, setDetails] = React.useState<CompanyDetails | null>(null);

  React.useEffect(() => {
    let abort = false;

    (async () => {
      setLoading(true);
      const list = await fetchMyCompanies();
      if (abort) return;

      if (list.length > 0) {
        const c = list[0];
        setCompanyId(c.id);
        setCompanyName(c.name ?? "Tu empresa");

        const d = await fetchCompanyDetails(c.id);
        if (abort) return;
        setDetails(d ?? null);
      } else {
        setCompanyId(null);
        setCompanyName("Tu empresa");
        setDetails(null);
      }

      setLoading(false);
    })();

    return () => {
      abort = true;
    };
  }, []);

  const infoEmail = details?.email ?? "—";
  const infoPhone = details?.phone ?? "—";
  const infoAddress = details?.address ?? "—";
  const infoEmployees = details?.employeesBand
    ? `${details.employeesBand} empleados`
    : "—";

  const hasCompany = !!companyId;

  return (
    <div className=" space-y-8 px-4 xl2:px-28 py-8">

      {/* Saludo superior */}
      <WelcomePanel name={name} />

      {/* Fila de KPIs (solo si hay empresa) */}
      {hasCompany && (
        <CompanyKpiRow
          key={companyId ?? "none"}
          companyId={companyId}
          name={companyName}
          email={infoEmail}
          phone={infoPhone}
          address={infoAddress}
          employeesText={infoEmployees}
        />
      )}

      {/* Card de mensaje de construcción */}
      <div className="flex justify-center">
        <Card className="max-w-xl w-full text-center shadow-md border border-slate-200">
          <CardHeader>
            <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-sky-500 text-white shadow-lg">
              <Hammer className="h-9 w-9" />
            </div>
            <CardTitle className="text-slate-800 text-xl">
              Estamos terminando este panel
            </CardTitle>
          </CardHeader>
          <CardContent className="text-slate-500 text-sm">
            En esta pantalla verás muy pronto un resumen de reputación,
            actividad reciente y alertas inteligentes para tus ubicaciones
            conectadas. <br className="hidden sm:block" />
            Seguimos afinando los datos durante la beta abierta. 🚧
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
