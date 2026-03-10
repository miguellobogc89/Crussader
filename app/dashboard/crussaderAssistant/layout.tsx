// app/dashboard/crussaderAssistant/layout.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import PageShell from "@/app/components/layouts/PageShell";
import TabMenu, { type TabItem } from "@/app/components/crussader/navigation/TabMenu";
import MainPannel from "@/app/components/crussader/UX/MainPannel";
import { MessageCircle, CalendarClock, Settings } from "lucide-react";

import type PageTitle from "@/app/components/layouts/PageTitle";
import type { ComponentProps } from "react";

type LucideIconName = ComponentProps<typeof PageTitle>["iconName"];

const TABS: TabItem[] = [
    {
    label: "Chat",
    href: "/dashboard/crussaderAssistant/chat",
    icon: <MessageCircle className="h-4 w-4" />,
    },
  {
    label: "Eventos",
    href: "/dashboard/crussaderAssistant/events",
    icon: <CalendarClock className="h-4 w-4" />,
  },
  {
    label: "Configuración",
    href: "/dashboard/crussaderAssistant/settings",
    icon: <Settings className="h-4 w-4" />,
  },
];

const PAGE_META: Record<string, { title: string; description: string; icon: LucideIconName }> = {
  chat: {
    title: "Crussader Assistant",
    description: "Gestiona conversaciones y asistentes por WhatsApp",
    icon: "MessageCircle",
  },
  events: {
    title: "Eventos del asistente",
    description: "Configura eventos programados y automatizaciones",
    icon: "CalendarClock",
  },
  settings: {
    title: "Configuración del asistente",
    description: "Ajusta el comportamiento general del asistente",
    icon: "Settings",
  },
};

export default function CrussaderAssistantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTab = useMemo(() => {
    if (!mounted) return "chat";
    if (pathname?.includes("/dashboard/crussaderAssistant/events")) return "events";
    if (pathname?.includes("/dashboard/crussaderAssistant/settings")) return "settings";
    return "chat";
  }, [mounted, pathname]);

  const { title, description, icon } = PAGE_META[activeTab];

  return (
    <PageShell
      title={title}
      description={description}
      titleIconName={icon}
      headerBand={
        <div key={mounted ? pathname : "initial"}>
          <TabMenu items={TABS} />
        </div>
      }
    >
      <div className="-mx-4 -mt-4 sm:mx-0 sm:mt-0">
        <MainPannel>{children}</MainPannel>
      </div>
    </PageShell>
  );
}