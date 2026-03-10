// app/dashboard/appointmentManager/layout.tsx
"use client";

import { usePathname } from "next/navigation";
import PageShell from "@/app/components/layouts/PageShell";
import TabMenu, { type TabItem } from "@/app/components/crussader/navigation/TabMenu";

import { CalendarDays, Settings } from "lucide-react";

import type PageTitle from "@/app/components/layouts/PageTitle";
import type { ComponentProps } from "react";

type LucideIconName = ComponentProps<typeof PageTitle>["iconName"];

const TABS: TabItem[] = [
  {
    label: "Overview",
    href: "/dashboard/appointmentManager/overview",
    icon: <CalendarDays className="w-4 h-4" />,
  },
  {
    label: "Configuración",
    href: "/dashboard/appointmentManager/settings",
    icon: <Settings className="w-4 h-4" />,
  },
];

const PAGE_META: Record<
  string,
  { title: string; description: string; icon: LucideIconName }
> = {
  overview: {
    title: "Appointment Manager",
    description: "Control de citas, confirmaciones y actividad",
    icon: "CalendarDays",
  },
  settings: {
    title: "Configuración",
    description: "Plantillas, timings y comportamiento de automatizaciones",
    icon: "Settings",
  },
};

export default function AppointmentManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const activeTab =
    Object.keys(PAGE_META).find((key) =>
      pathname?.includes(`/dashboard/appointmentManager/${key}`)
    ) ?? "overview";

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
      <div className="py-6">{children}</div>
    </PageShell>
  );
}