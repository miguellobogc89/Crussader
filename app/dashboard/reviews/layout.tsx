// app/dashboard/reviews/layout.tsx
"use client";

import { usePathname } from "next/navigation";
import PageShell from "@/app/components/layouts/PageShell";
import TabMenu, { type TabItem } from "@/app/components/crussader/navigation/TabMenu";
import MainPannel from "@/app/components/crussader/UX/MainPannel";

import { MessageSquare, BarChart3, Smile, Settings } from "lucide-react";

// 👇 importa SOLO el tipo del componente para sacar su prop "iconName"
import type PageTitle from "@/app/components/layouts/PageTitle";
import type { ComponentProps } from "react";

// 👇 union exacta de nombres de iconos aceptados por PageTitle
type LucideIconName = ComponentProps<typeof PageTitle>["iconName"];

const TABS: TabItem[] = [
  { label: "Reseñas", href: "/dashboard/reviews/summary", icon: <MessageSquare className="w-4 h-4" /> },
  { label: "Informes", href: "/dashboard/reviews/reports", icon: <BarChart3 className="w-4 h-4" /> },
  { label: "Sentimiento", href: "/dashboard/reviews/sentiment", icon: <Smile className="w-4 h-4" /> },
  { label: "Configuración", href: "/dashboard/reviews/settings", icon: <Settings className="w-4 h-4" /> },
];

const PAGE_META: Record<string, { title: string; description: string; icon: LucideIconName }> = {
  summary: {
    title: "Reseñas",
    description: "Lee y responde a las reseñas de tus establecimientos",
    icon: "MessageSquare",
  },
  reports: {
    title: "Reportes y Análisis",
    description: "Métricas completas de rendimiento y tendencias",
    icon: "BarChart3",
  },
  sentiment: {
    title: "Análisis de Sentimiento",
    description: "Distribución emocional, palabras clave y opiniones destacadas",
    icon: "Smile",
  },
  settings: {
    title: "Configuración de Respuestas",
    description: "Personaliza el tono, idioma y comportamiento de las respuestas automáticas",
    icon: "Settings",
  },
};

export default function ReviewsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const activeTab =
    Object.keys(PAGE_META).find((key) => pathname?.includes(`/dashboard/reviews/${key}`)) ?? "summary";

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
      {/* ✅ Compensa el padding horizontal del PageBody en móvil */}
      <div className="-mx-4 -mt-4 sm:mx-0 sm:mt-0">
        <MainPannel>{children}</MainPannel>
      </div>
    </PageShell>
  );
}
