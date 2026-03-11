// app/dashboard/mybusiness/layout.tsx
"use client";

import { usePathname } from "next/navigation";
import PageShell from "@/app/components/layouts/PageShell";
import TabMenu, { type TabItem } from "@/app/components/crussader/navigation/TabMenu";

import { Building2, BarChart3, MessageSquare, CalendarDays, Users, Settings, Shield } from "lucide-react";

import type PageTitle from "@/app/components/layouts/PageTitle";
import type { ComponentProps } from "react";

type LucideIconName = ComponentProps<typeof PageTitle>["iconName"];

const TABS: TabItem[] = [
  { label: "Resumen", href: "/dashboard/mybusiness/overview", icon: <BarChart3 className="w-4 h-4" /> },
  { label: "Mi negocio", href: "/dashboard/mybusiness/reputation", icon: <MessageSquare className="w-4 h-4" /> },
];

const PAGE_META: Record<
  string,
  { title: string; description: string; icon: LucideIconName }
> = {
  overview: {
    title: "My business",
    description: "Sala de control del negocio: reputación, agenda y operación",
    icon: "Building2",
  },
  reputation: {
    title: "Reputación",
    description: "Reviews, tasa de respuesta y riesgos",
    icon: "MessageSquare",
  },
  calendar: {
    title: "Agenda",
    description: "Pendientes, confirmaciones y salud operativa",
    icon: "CalendarDays",
  },
  customers: {
    title: "Clientes",
    description: "Nuevos, recurrentes, bajas y segmentos",
    icon: "Users",
  },
  integrations: {
    title: "Integraciones",
    description: "Estado de conectores y alertas accionables",
    icon: "Building2",
  },
  compliance: {
    title: "Cumplimiento",
    description: "Auditoría, privacidad y trazabilidad",
    icon: "Shield",
  },
  settings: {
    title: "Ajustes",
    description: "Preferencias operativas y configuración futura del “cerebro”",
    icon: "Settings",
  },
};

export default function MyBusinessLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const activeTab =
    Object.keys(PAGE_META).find((key) => pathname?.includes(`/dashboard/mybusiness/${key}`)) ??
    "overview";

  const { title, description, icon } = PAGE_META[activeTab];

  return (
    <PageShell
      title={title}
      description={description}
      titleIconName={icon}
      headerBand={
        <div key={pathname}>
          <TabMenu items={TABS} />
        </div>
      }
    >
        <div className="py-6">
        {children}
        </div>
    </PageShell>
  );
}