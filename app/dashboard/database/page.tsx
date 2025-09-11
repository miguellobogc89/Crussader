// app/dashboard/database/page.tsx
"use client";

import * as React from "react";
import SectionScaffold from "@/app/components/SectionScaffold";
import { Card } from "@/app/components/ui/card";
import { MapPin, Star, MessageCircle, Database } from "lucide-react";
import LocationsTable, {
  type UiLocationRow,
} from "@/app/components/database/LocationsTable";

// ---------------- Helpers ----------------

type CompanyRow = { id: string; name: string; role: string; createdAt: string };

async function fetchMyCompanies(): Promise<CompanyRow[]> {
  const r = await fetch("/api/companies", { cache: "no-store" });
  if (!r.ok) return [];
  const j = await r.json();
  return Array.isArray(j?.companies) ? j.companies : [];
}

type ApiLocation = {
  id: string;
  title: string | null;
  name?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  type?: string | null;
  createdAt?: string;
  lastSyncAt?: string | null;
  googlePlaceId?: string | null;
  reviewsAvg?: number | string | null;
  reviewsCount?: number | null;
  status?: string | null;
  ExternalConnection?: { id: string; provider: string; accountEmail?: string | null } | null;
};

function joinAddress(address?: string | null, city?: string | null, postal?: string | null) {
  const parts = [address, city, postal].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}

function parseNumber(n: unknown, def = 0) {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) ? v : def;
}

function timeAgoOrDash(iso?: string | null) {
  if (!iso) return "—";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "—";
  const diff = Date.now() - dt.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Hace <1 min";
  if (m < 60) return `Hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h} h`;
  const d = Math.floor(h / 24);
  return `Hace ${d} d`;
}

// ---------------- Page ----------------

export default function DatabasePage() {
  const [rows, setRows] = React.useState<UiLocationRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedLocation, setSelectedLocation] = React.useState<string | number | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1) mi empresa
      const companies = await fetchMyCompanies();
      if (!companies.length) {
        setRows([]);
        setLoading(false);
        return;
      }
      const companyId = companies[0].id;

      // 2) ubicaciones
      const r = await fetch(`/api/companies/${companyId}/locations`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);

      const list: ApiLocation[] = Array.isArray(j?.locations) ? j.locations : [];

      // 3) map a UI
      const mapped: UiLocationRow[] = list.map((loc) => {
        const id = loc.id;
        const name = (loc.title ?? (loc as any).name ?? "Ubicación") as string;
        const address = joinAddress(loc.address ?? null, loc.city ?? null, loc.postalCode ?? null);
        const category = (loc.type as string | null) ?? "—";
        const createdAt = (loc.createdAt as string) ?? new Date().toISOString();
        const connected = Boolean(loc.googlePlaceId || loc.ExternalConnection?.id);
        const avgRating = parseNumber(loc.reviewsAvg, 0);
        const totalReviews = parseNumber(loc.reviewsCount, 0);
        const monthlyReviews = 0;
        const lastSync = timeAgoOrDash(loc.lastSyncAt ?? null);
        const status = (loc.status as string | null) ?? (connected ? "active" : "disconnected");
        const responseRate = 0;

        return {
          id,
          name,
          address,
          category,
          createdAt,
          connected,
          avgRating,
          totalReviews,
          monthlyReviews,
          lastSync,
          status,
          responseRate,
        };
      });

      setRows(mapped);
    } catch (e: any) {
      setError(e?.message || String(e));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  // Stats top
  const totalLocations = rows.length;
  const totalConnected = rows.filter((l) => l.connected).length;
  const averageRating =
    rows.length > 0 ? (rows.reduce((acc, l) => acc + l.avgRating, 0) / rows.length).toFixed(1) : "—";
  const totalReviews = rows.reduce((acc, l) => acc + l.totalReviews, 0);

  return (
    <SectionScaffold
      title="Base de datos"
      subtitle="Gestiona ubicaciones, conexiones y sincronizaciones."
      icon={Database}
      /* tabs opcionales más adelante */
    >
      <div className="space-y-6">
        {/* Error */}
        {error && <Card className="p-4 text-sm text-red-600">{error}</Card>}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Ubicaciones</p>
                <p className="text-2xl font-bold">{loading ? "—" : totalLocations}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conectadas</p>
                <p className="text-2xl font-bold text-green-600">
                  {loading ? "—" : totalConnected}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rating Promedio</p>
                <p className="text-2xl font-bold">{loading ? "—" : averageRating}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Reviews Totales</p>
                <p className="text-2xl font-bold">{loading ? "—" : totalReviews}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabla (componente) */}
        <LocationsTable
          rows={rows}
          loading={loading}
          selectedId={selectedLocation}
          onSelect={setSelectedLocation}
        />
      </div>
    </SectionScaffold>
  );
}
