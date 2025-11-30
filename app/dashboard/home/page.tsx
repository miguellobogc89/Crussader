// app/dashboard/home/page.tsx
"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

import RouteTransitionOverlay from "@/app/components/layouts/RouteTransitionOverlay";
import Spinner from "@/app/components/crussader/UX/Spinner";

import {
  useBootstrapStatus,
  useBootstrapStore,
} from "@/app/providers/bootstrap-store";

import HomeWelcomeHeader from "@/app/components/home/HomeWelcomeHeader";
import HomeQuickStats from "@/app/components/home/HomeQuickStats";
import HomeSubscriptionCard from "@/app/components/home/HomeSubscriptionCard";
import HomeCompanyCard from "@/app/components/home/HomeCompanyCard";
import HomeLocationsCard from "@/app/components/home/HomeLocationsCard";
import HomeIntegrationsCard from "@/app/components/home/HomeIntegrationsCard";

// De momento mantenemos el mock SOLO para el resto de cards
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
  const { data: session, status: sessionStatus } = useSession();

  const status = useBootstrapStatus();
  const fetchFromApi = useBootstrapStore((s) => s.fetchFromApi);

  const { user, company, metrics } = mock;

  // Dispara bootstrap si está idle (igual que PageShell)
  useEffect(() => {
    if (status === "idle") {
      fetchFromApi();
    }
  }, [status, fetchFromApi]);

  const isBootstrapLoading = status === "idle" || status === "loading";
  const isSessionLoading = sessionStatus === "loading";

  // ⬇️ Mientras bootstrap o sesión estén cargando → SOLO spinner + barra
  if (isBootstrapLoading || isSessionLoading) {
    return (
      <div className="relative w-full h-full">
        <RouteTransitionOverlay scope="container" className="z-50" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="h-[40vh] flex flex-col items-center justify-center gap-4">
            <Spinner centered size={48} color="#6366f1" />
          </div>
        </div>
      </div>
    );
  }

  // ⬇️ Aquí ya tenemos sesión lista; si no hay nombre, usamos uno genérico
  const displayName = session?.user?.name || "Usuario";

  return (
    <div className="relative w-full h-full">
      <RouteTransitionOverlay scope="container" className="z-50" />

      <div className="mx-36 space-y-6 my-12">
        <HomeWelcomeHeader name={displayName} />

        <HomeQuickStats
          metrics={metrics}
          company={{ totalReviews: company.totalReviews }}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <HomeSubscriptionCard />
          <HomeCompanyCard />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <HomeLocationsCard />
          <HomeIntegrationsCard />
        </div>
      </div>
    </div>
  );
}
