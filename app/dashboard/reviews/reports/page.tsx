// app/dashboard/reviews/reports/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { LineChart, PieChart, MapPin, Gauge } from "lucide-react";

import TabMenu, {
  type TabItem,
} from "@/app/components/crussader/navigation/TabMenu";
import ReportsPanel from "@/app/components/reviews/reports/ReportsPanel";
import type { SectionKey } from "@/app/components/reviews/reports/types";
import LocationSelector, {
  type LocationLite,
} from "@/app/components/crussader/LocationSelector";

const SECTION_META: Record<SectionKey, { title: string; desc: string }> = {
  trends: {
    title: "Tendencias",
    desc: "Detalle mensual y acumulados de rating y volumen.",
  },
  analysis: {
    title: "Análisis",
    desc: "Distribución de estrellas, sentimiento y términos destacados.",
  },
  locations: {
    title: "Ubicaciones",
    desc: "Ranking por local: rating, volumen y SLA de respuesta.",
  },
  performance: {
    title: "Rendimiento",
    desc: "SLA, %<2h, P50/P90 y objetivos vs. actual.",
  },
};

const TABS: TabItem[] = [
  {
    label: "Tendencias",
    href: "/dashboard/reviews/reports#trends",
    icon: <LineChart className="w-4 h-4" />,
  },
  {
    label: "Análisis",
    href: "/dashboard/reviews/reports#analysis",
    icon: <PieChart className="w-4 h-4" />,
  },
  {
    label: "Ubicaciones",
    href: "/dashboard/reviews/reports#locations",
    icon: <MapPin className="w-4 h-4" />,
  },
  {
    label: "Rendimiento",
    href: "/dashboard/reviews/reports#performance",
    icon: <Gauge className="w-4 h-4" />,
  },
];

function getHashSection(): SectionKey {
  if (typeof window === "undefined") return "trends";
  const raw = window.location.hash.replace("#", "");
  const allowed = new Set<SectionKey>([
    "trends",
    "analysis",
    "locations",
    "performance",
  ]);
  return allowed.has(raw as SectionKey) ? (raw as SectionKey) : "trends";
}

export default function ReportsPage() {
  const [section, setSection] = useState<SectionKey>(() => getHashSection());
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    null,
  );
  const [selectedLocation, setSelectedLocation] = useState<LocationLite | null>(
    null,
  );

  useEffect(() => {
    const onHash = () => setSection(getHashSection());
    window.addEventListener("hashchange", onHash);
    onHash();
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const meta = useMemo(() => SECTION_META[section], [section]);

  const handleLocationSelect = (
    id: string | null,
    location?: LocationLite | null,
  ) => {
    setSelectedLocationId(id);
    setSelectedLocation(location ?? null);
  };

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-3 sm:px-6 py-6 space-y-6">
      {/* fila superior: tabs izquierda, selector ubicación derecha */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0">
          <TabMenu items={TABS} />
        </div>

        <div className="sm:pl-4 w-full sm:w-80 shrink-0">
          <div className="flex flex-col gap-1 items-stretch sm:items-end">
            <LocationSelector onSelect={handleLocationSelect} />
          </div>
        </div>
      </div>

      <ReportsPanel
        section={section}
        meta={meta}
        selectedLocationId={selectedLocationId}
        selectedLocation={selectedLocation}
      />
    </div>
  );
}
