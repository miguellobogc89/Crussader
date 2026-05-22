// app/dashboard/whatsapp/layout.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import PageShellNoScroll from "@/app/components/layouts/PageShellNoScroll";
import TabMenu, { type TabItem } from "@/app/components/crussader/navigation/TabMenu";
import { MessageCircle, LayoutTemplate, Settings } from "lucide-react";

import type PageTitle from "@/app/components/layouts/PageTitle";
import type { ComponentProps } from "react";

type LucideIconName = ComponentProps<typeof PageTitle>["iconName"];

const TABS: TabItem[] = [
  { label: "Chat", href: "/dashboard/whatsapp/chat", icon: <MessageCircle className="w-4 h-4" /> },
  { label: "Plantillas", href: "/dashboard/whatsapp/templates", icon: <LayoutTemplate className="w-4 h-4" /> },
  { label: "Configuración", href: "/dashboard/whatsapp/settings", icon: <Settings className="w-4 h-4" /> },
];

const PAGE_META: Record<string, { title: string; description: string; icon: LucideIconName }> = {
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTab = useMemo(() => {
    if (!mounted) return "chat";

    return (
      Object.keys(PAGE_META).find((key) =>
        pathname?.includes(`/dashboard/whatsapp/${key}`)
      ) ?? "chat"
    );
  }, [mounted, pathname]);

  const { title, description, icon } = PAGE_META[activeTab];

  return (
    <PageShellNoScroll
      title={title}
      description={description}
      titleIconName={icon}
      headerBand={
        <div key={mounted ? pathname : "initial"}>
          <TabMenu items={TABS} />
        </div>
      }
    >
      <div className="h-full min-h-0 w-full bg-transparent px-4 py-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </PageShellNoScroll>
  );
}