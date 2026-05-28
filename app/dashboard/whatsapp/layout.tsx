// app/dashboard/whatsapp/layout.tsx
import PageShellNoScroll from "@/app/components/layouts/PageShellNoScroll";
import TabMenu, { type TabItem } from "@/app/components/crussader/navigation/TabMenu";
import { MessageCircle, LayoutTemplate, Settings } from "lucide-react";

const TABS: TabItem[] = [
  { label: "Chat", href: "/dashboard/whatsapp/chat", icon: <MessageCircle className="h-4 w-4" /> },
  { label: "Plantillas", href: "/dashboard/whatsapp/templates", icon: <LayoutTemplate className="h-4 w-4" /> },
  { label: "Configuración", href: "/dashboard/whatsapp/settings", icon: <Settings className="h-4 w-4" /> },
];

export default function WhatsAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageShellNoScroll
      title="WhatsApp"
      description="Gestiona conversaciones, plantillas y configuración de Meta"
      titleIconName="MessageCircle"
      headerBand={<TabMenu items={TABS} />}
    >
      <div className="h-full min-h-0 w-full bg-transparent px-4 py-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </PageShellNoScroll>
  );
}