// app/dashboard/home/page.tsx

import PageShell from "@/app/components/layouts/PageShell";
import HomeWelcomeHeader from "@/app/components/home/HomeWelcomeHeader";
import HomeQuickStats from "@/app/components/home/HomeQuickStats";
import HomeSubscriptionCard from "@/app/components/home/HomeSubscriptionCard";
import HomeCompanyCard from "@/app/components/home/HomeCompanyCard";
import HomeLocationsCard from "@/app/components/home/HomeLocationsCard";
import HomeIntegrationsCard from "@/app/components/home/HomeIntegrationsCard";
import HomeQuickActions from "@/app/components/home/HomeQuickActions";

// De momento mantenemos el mock SOLO para el resto de cards
// (luego las iremos enchufando igual a bootstrap/API)
const mock = {
  user: {
    name: "María García",
    memberSince: "Enero 2024",
  },
  company: {
    name: "Restaurante El Buen Gusto",
    industry: "Restauración",
    locations: 3,
    totalReviews: 1247,
  },
  locations: [
    { id: 1, name: "Sucursal Centro", city: "Madrid", status: "active", reviews: 542 },
    { id: 2, name: "Sucursal Norte", city: "Barcelona", status: "active", reviews: 398 },
    { id: 3, name: "Sucursal Sur", city: "Valencia", status: "active", reviews: 307 },
  ],
  integrations: [
    { id: 1, name: "Google Business", status: "active" as const, lastSync: "Hace 2 horas" },
    { id: 2, name: "Facebook", status: "active" as const, lastSync: "Hace 5 horas" },
    { id: 3, name: "TripAdvisor", status: "warning" as const, lastSync: "Hace 2 días" },
  ],
  metrics: {
    avgRating: 4.6,
    responseRate: 94,
    avgResponseTime: "2.3 horas",
    newReviews: 23,
  },
};

export default function DashboardHomePage() {
  const { user, company, locations, integrations, metrics } = mock;

  return (
    <PageShell
      title="Panel de inicio"
      description="Resumen rápido de tu cuenta, reseñas e integraciones."
    >
      <div className="w-full space-y-6">
        <HomeWelcomeHeader name={user.name} />

        <HomeQuickStats
          metrics={metrics}
          company={{ totalReviews: company.totalReviews }}
        />

        <div className="grid gap-6 md:grid-cols-2">
          {/* ⬇️ Ahora esta card usa datos reales del endpoint */}
          <HomeSubscriptionCard />
          <HomeCompanyCard company={company} user={{ memberSince: user.memberSince }} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <HomeLocationsCard locations={locations} />
          <HomeIntegrationsCard integrations={integrations} />
        </div>

        <HomeQuickActions />
      </div>
    </PageShell>
  );
}
