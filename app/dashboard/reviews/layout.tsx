import PageShell from "@/app/components/layouts/PageShell";
import TabMenu, { type TabItem } from "@/app/components/crussader/navigation/TabMenu";

const TABS: TabItem[] = [
  { label: "Reseñas",       href: "/dashboard/reviews/summary" },
  { label: "Informes",      href: "/dashboard/reviews/reports" },
  { label: "Sentimiento",   href: "/dashboard/reviews/sentiment" },
  { label: "Configuración", href: "/dashboard/reviews/settings" },
];

export default function ReviewsLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageShell
      title="Reseñas"
      description="Lee y responde a las reseñas de tus establecimientos"
      headerBand={<TabMenu items={TABS} />}
    >
      <div className="mx-auto w-full max-w-screen-2xl px-3 sm:px-6">
        {children}
      </div>
    </PageShell>
  );
}
