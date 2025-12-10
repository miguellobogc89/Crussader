// app/dashboard/settings/layout.tsx
/*import PageShell from "@/app/components/layouts/PageShell";
import TabMenu, { type TabItem } from "@/app/components/crussader/navigation/TabMenu";

const TABS: TabItem[] = [
  { label: "General",       href: "/dashboard/settings/general" },
  { label: "Cuenta",      href: "/dashboard/settings/account" },
  { label: "Facturación",   href: "/dashboard/settings/billing" },
  { label: "Notificaciones", href: "/dashboard/settings/notifications" },
  { label: "Labs", href: "/dashboard/settings/labs" },
];

export default function ReviewsLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageShell
      title="Configuración"
      description="Ajusta la configuración general de tu cuenta"
      headerBand={<TabMenu items={TABS} />}
    >
      <div className="mx-auto w-full max-w-screen-2xl px-3 sm:px-6">
        {children}
      </div>
    </PageShell>
  );
}*/


// app/dashboard/settings/layout.tsx
import type { ReactNode } from "react";
import PageShell from "@/app/components/layouts/PageShell";

export default function SettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <PageShell
      title="Ajustes de cuenta"
      titleIconName="Settings" // 👈 icono en el header (ajusta el nombre si usas otro mapeo)
      description="Gestiona tu perfil, tu cuenta y la configuración general."
      variant="narrow"
    >
      <div className="mx-auto w-full max-w-4xl px-3 sm:px-6">
        {children}
      </div>
    </PageShell>
  );
}




