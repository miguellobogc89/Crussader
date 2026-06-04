// app/dashboard/mybusiness/layout.tsx
import PageShellNoScroll from "@/app/components/layouts/PageShellNoScroll";
import TabMenu, { type TabItem } from "@/app/components/crussader/navigation/TabMenu";
import { BriefcaseBusiness, Users, Settings } from "lucide-react";

const TABS: TabItem[] = [
  {
    label: "Inicio",
    href: "/dashboard/mybusiness/home",
    icon: <BriefcaseBusiness className="h-4 w-4" />,
  },
  {
    label: "Empleados",
    href: "/dashboard/mybusiness/employees",
    icon: <Users className="h-4 w-4" />,
  },
  {
    label: "Configuración",
    href: "/dashboard/mybusiness/settings",
    icon: <Settings className="h-4 w-4" />,
  },
];

export default function MyBusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageShellNoScroll
      title="Mi negocio"
      description="Gestiona empleados, servicios y configuración operativa del negocio"
      titleIconName="Building2"
      headerBand={<TabMenu items={TABS} />}
    >
      <div className="h-full min-h-0 w-full bg-transparent px-4 py-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </PageShellNoScroll>
  );
}