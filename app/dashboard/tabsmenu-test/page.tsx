import { TabsMenu, type TabItem } from "@/app/components/TabsMenu";
import type { ReactNode } from "react";

const SETTINGS_TABS: TabItem[] = [
  { href: "/dashboard/settings/responses", label: "Respuestas", icon: "message-circle" },
  { href: "/dashboard/settings/billing", label: "Facturación y planes", icon: "credit-card" },
  { href: "/dashboard/settings/notifications", label: "Notificaciones", icon: "bell" },
  { href: "/dashboard/settings/user", label: "Usuario", icon: "user" },
  { href: "/dashboard/settings/labs", label: "Labs", icon: "beaker", beta: true },
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <TabsMenu
      title="Ajustes"
      description="Configura tu dashboard y preferencias"
      mainIcon="settings"
      tabs={SETTINGS_TABS}
    >
      {children}
    </TabsMenu>
  );
}
