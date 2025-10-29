// app/dashboard/reviews/layout.tsx
"use client";

import { usePathname } from "next/navigation";
import PageShell from "@/app/components/layouts/PageShell";
import TabMenu, { type TabItem } from "@/app/components/crussader/navigation/TabMenu";

const TABS: TabItem[] = [
  { label: "Reseñas",       href: "/dashboard/reviews/summary" },
  { label: "Informes",      href: "/dashboard/reviews/reports" },
  { label: "Sentimiento",   href: "/dashboard/reviews/sentiment" },
  { label: "Configuración", href: "/dashboard/reviews/settings" },
];

const PAGE_META: Record<string, { title: string; description: string }> = {
  summary: {
    title: "Reseñas",
    description: "Lee y responde a las reseñas de tus establecimientos",
  },
  reports: {
    title: "Reportes y Análisis",
    description: "Métricas completas de rendimiento y tendencias",
  },
  sentiment: {
    title: "Análisis de Sentimiento",
    description: "Distribución emocional, palabras clave y opiniones destacadas",
  },
  settings: {
    title: "Configuración de Respuestas",
    description: "Personaliza el tono, idioma y comportamiento de las respuestas automáticas",
  },
};

export default function ReviewsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Detecta la subruta activa y actualiza título/subtítulo al instante en cada navegación de tab
  const activeTab =
    Object.keys(PAGE_META).find((key) => pathname?.includes(`/dashboard/reviews/${key}`)) ?? "summary";

  const { title, description } = PAGE_META[activeTab];

  return (
    <PageShell
      title={title}
      description={description}
      headerBand={
        // key por pathname para forzar re-render visual inmediato del TabMenu
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
