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
import { useBootstrapData } from "@/app/providers/bootstrap-store";

export default function DashboardHomePage() {
  const bootstrap = useBootstrapData();

  const name = bootstrap?.user?.name ?? "—";

  const companyId = bootstrap?.activeCompany?.id ?? null;
  const companyName = bootstrap?.activeCompany?.name ?? "Tu empresa";

  const infoEmail = bootstrap?.activeCompany?.website ?? "—"; // si aquí querías email real, ahora lo ajustamos en otro paso
  const infoPhone = "—";
  const infoAddress = "—";
  const infoEmployees = "—";

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
      <WelcomePanel name={name} />

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

      <Card className="border-slate-200 shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="text-slate-800 text-lg">Accesos rápidos</CardTitle>
        </CardHeader>

        <CardContent>
          <div
            className="
              grid
              gap-4
              grid-cols-1
              sm:grid-cols-2
              lg:grid-cols-4
              xl:grid-cols-4
              2xl:grid-cols-4
            "
          >
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className="group">
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
