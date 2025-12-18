// app/dashboard/home/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import {
  MessageCircleMore,
  BarChart3,
  ShieldCheck,
  Building2,
} from "lucide-react";

import WelcomePanel from "@/app/components/home/WelcomePanel";
import HomeMainPanel from "@/app/components/home/panels/HomeMainPanel";
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

  const quickLinks = [
    {
      href: "/dashboard/reviews/summary",
      title: "Reseñas",
      description: "Revisa y responde las opiniones de tus clientes.",
      icon: MessageCircleMore,
    },
    {
      href: "/dashboard/reviews/reports",
      title: "Informes",
      description: "Analiza tendencias y rendimiento de tus ubicaciones.",
      icon: BarChart3,
    },
    {
      href: "/dashboard/reviews/settings",
      title: "Ajustes de respuesta",
      description: "Configura el tono y las reglas de tus respuestas.",
      icon: ShieldCheck,
    },
    {
      href: "/dashboard/mybusiness",
      title: "Mi negocio",
      description: "Gestiona tu empresa, ubicaciones y datos principales.",
      icon: Building2,
    },
  ];

  return (
    <div className="space-y-8 px-4 xl2:px-28">
      {/* Saludo superior */}
      <WelcomePanel name={name} />

      {/* Fila de KPIs (solo si hay empresa) */}
      {hasCompany && (
        <HomeMainPanel
          key={companyId ?? "none"}
          companyId={companyId}
          name={companyName}
          email={infoEmail}
          phone={infoPhone}
          address={infoAddress}
          employeesText={infoEmployees}
        />
      )}

      {/* Panel de accesos rápidos */}
      <Card className="border-slate-200 shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="text-slate-800 text-lg">
            Accesos rápidos
          </CardTitle>
        </CardHeader>
<CardContent>
  <div
    className="
      grid
      gap-4
      grid-cols-1
      sm:grid-cols-2
      lg:grid-cols-4     /* 🔥 Fuerza 4 columnas a partir de portátil */
      xl:grid-cols-4
      2xl:grid-cols-4
    "
  >
    {quickLinks.map((item) => {
      const Icon = item.icon;
      return (
        <Link
          key={item.href}
          href={item.href}
          className="group"
        >
          <Card className="h-full border-slate-200 hover:border-sky-300 transition-colors shadow-sm hover:shadow-md">
            <CardContent className="flex flex-col gap-2 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 group-hover:bg-sky-100">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="font-semibold text-slate-900 text-sm sm:text-base">
                  {item.title}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {item.description}
              </p>
            </CardContent>
          </Card>
        </Link>
      );
    })}
  </div>
</CardContent>

      </Card>
    </div>
  );
}
