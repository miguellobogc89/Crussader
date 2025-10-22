import PageShell from "@/app/components/layouts/PageShell";
import TabMenu, { type TabItem } from "@/app/components/crussader/navigation/TabMenu";

const TABS: TabItem[] = [
  { label: "General",       href: "/dashboard/settings/general" },
  { label: "Usuario",       href: "/dashboard/settings/user" },
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
}
