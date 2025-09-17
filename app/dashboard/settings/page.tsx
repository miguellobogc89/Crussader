// app/dashboard/settings/page.tsx
import { TabsMenu, type TabItem } from "@/app/components/TabsMenu";

// Importa directamente tus componentes (pueden ser Client Components con "use client")
import ResponsesTab from "@/app/components/settings/ResponsesTab";
import BillingTab   from "@/app/components/settings/BillingTab";
import NotifsTab    from "@/app/components/settings/NotificationsTab";
import UserTab      from "@/app/components/settings/UserTab";
import LabsTab      from "@/app/components/settings/LabsTab";

export const dynamic = "force-dynamic";

const SETTINGS_TABS: TabItem[] = [
  { href: "?tab=responses",     label: "Respuestas",            icon: "message-circle" },
  { href: "?tab=billing",       label: "Facturación y planes",  icon: "credit-card"    },
  { href: "?tab=notifications", label: "Notificaciones",        icon: "bell"           },
  { href: "?tab=user",          label: "Usuario",               icon: "user"           },
  { href: "?tab=labs",          label: "Labs",                  icon: "beaker", beta: true },
];

type TabKey = "responses" | "billing" | "notifications" | "user" | "labs";

export default function SettingsPage({
  searchParams,
}: {
  searchParams?: { tab?: TabKey };
}) {
  const tab = (searchParams?.tab ?? "responses") as TabKey;

  return (
    <TabsMenu
      title="Ajustes"
      description="Configura tu dashboard y preferencias"
      mainIcon="settings"
      tabs={SETTINGS_TABS}
    >
      {tab === "responses" && (
        <section id="responses">
          <ResponsesTab />
        </section>
      )}

      {tab === "billing" && (
        <section id="billing">
          <BillingTab />
        </section>
      )}

      {tab === "notifications" && (
        <section id="notifications">
          <NotifsTab />
        </section>
      )}

      {tab === "user" && (
        <section id="user">
          <UserTab />
        </section>
      )}

      {tab === "labs" && (
        <section id="labs">
          <LabsTab />
        </section>
      )}
    </TabsMenu>
  );
}
