// app/dashboard/reviews/layout.tsx
"use client";

import { usePathname } from "next/navigation";
import PageShell from "@/app/components/layouts/PageShell";
import TabMenu, { type TabItem } from "@/app/components/crussader/navigation/TabMenu";

// 👇 importa SOLO el tipo del componente para sacar su prop "iconName"
import type PageTitle from "@/app/components/layouts/PageTitle";
import type { ComponentProps } from "react";

// 👇 tipo exacto de iconName (union de nombres de iconos de lucide)
type LucideIconName = ComponentProps<typeof PageTitle>["iconName"];

const TABS: TabItem[] = [
  { label: "Reseñas",       href: "/dashboard/reviews/summary" },
  { label: "Informes",      href: "/dashboard/reviews/reports" },
  { label: "Sentimiento",   href: "/dashboard/reviews/sentiment" },
  { label: "Configuración", href: "/dashboard/reviews/settings" },
];

const PAGE_META: Record<
  string,
  { title: string; description: string; icon: LucideIconName }
> = {
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
      titleIconName={icon} // ✅ ahora tipado correctamente
      headerBand={
        <div key={pathname}>
          <TabMenu items={TABS} />
        </div>
      }
    >
      <div className="mx-auto w-full max-w-screen-2xl px-3 sm:px-6">
        {children}
      </div>
    </PageShell>
  );
}
