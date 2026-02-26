// app/dashboard/admin/whatsapp/layout.tsx
"use client";

import { usePathname } from "next/navigation";
import PageShell from "@/app/components/layouts/PageShell";
import TabMenu, { type TabItem } from "@/app/components/crussader/navigation/TabMenu";
import MainPannel from "@/app/components/crussader/UX/MainPannel";

import { MessageCircle, LayoutTemplate, Settings } from "lucide-react";

import type PageTitle from "@/app/components/layouts/PageTitle";
import type { ComponentProps } from "react";

type LucideIconName = ComponentProps<typeof PageTitle>["iconName"];

const TABS: TabItem[] = [
  {
    label: "Chat",
    href: "/dashboard/admin/whatsapp",
    icon: <MessageCircle className="w-4 h-4" />,
  },
  {
    label: "Plantillas",
    href: "/dashboard/admin/whatsapp/templates",
    icon: <LayoutTemplate className="w-4 h-4" />,
  },
  {
    label: "Configuración",
    href: "/dashboard/admin/whatsapp/settings",
    icon: <Settings className="w-4 h-4" />,
  },
];

const PAGE_META: Record<
  string,
  { title: string; description: string; icon: LucideIconName }
> = {
  chat: {
    title: "WhatsApp",
    description: "Gestiona conversaciones y envía mensajes a tus clientes",
    icon: "MessageCircle",
  },
  templates: {
    title: "Plantillas de WhatsApp",
    description: "Gestiona las plantillas oficiales aprobadas en Meta",
    icon: "LayoutTemplate",
  },
  settings: {
    title: "Configuración de WhatsApp",
    description: "Conecta un número y gestiona la integración con Meta",
    icon: "Settings",
  },
};

export default function WhatsAppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  let activeTab: "chat" | "templates" | "settings" = "chat";
  if (pathname?.includes("/templates")) {
    activeTab = "templates";
  }
  if (pathname?.includes("/settings")) {
    activeTab = "settings";
  }

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
      <div className="-mx-4 -mt-4 sm:mx-0 sm:mt-0">
        <MainPannel>{children}</MainPannel>
      </div>
    </PageShell>
  );
}