// app/dashboard/reviews/page.tsx
"use client";

import * as React from "react";
import { Layout } from "@/app/components/Layout";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Card } from "@/app/components/ui/card";
import {
  MapPin,
  Star,
  MessageCircle,
  Calendar,
  Settings,
  Trash2,
} from "lucide-react";

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
  type?: string | null; // si en tu schema usas LocationType
  createdAt?: string;   // asegúrate de incluirlo en el select del endpoint
  lastSyncAt?: string | null;
  googlePlaceId?: string | null;
  reviewsAvg?: number | string | null;
  reviewsCount?: number | null;
  status?: string | null;
  ExternalConnection?: { id: string; provider: string; accountEmail?: string | null } | null;
};

type UiLocationRow = {
  id: string | number;
  name: string;
  address: string;
  category: string;
  createdAt: string; // ISO
  connected: boolean;
  avgRating: number;
  totalReviews: number;
  monthlyReviews: number; // si no lo tienes en BD lo dejamos en 0
  lastSync: string; // string humanizado o “—”
  status: string;   // "active" | "pending" | "disconnected" | etc.
  responseRate: number; // si no lo tienes, 0
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

const getStatusBadge = (status: string, connected: boolean) => {
  if (!connected) return <Badge variant="destructive">Desconectado</Badge>;

  switch (status) {
    case "active":
      return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Activo</Badge>;
    case "pending":
      return <Badge variant="secondary">Pendiente</Badge>;
    default:
      return <Badge variant="outline">Desconocido</Badge>;
  }
};

const getRatingColor = (rating: number) => {
  if (rating >= 4.5) return "text-green-600";
  if (rating >= 4.0) return "text-yellow-600";
  return "text-red-600";
};

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

      // 3) map a UI (misma forma que tu mock)
      const mapped: UiLocationRow[] = list.map((loc) => {
        const id = loc.id;
        const name = (loc.title ?? (loc as any).name ?? "Ubicación") as string;
        const address = joinAddress(loc.address ?? null, loc.city ?? null, loc.postalCode ?? null);
        const category = (loc.type as string | null) ?? "—"; // si no tienes, queda "—"
        const createdAt = (loc.createdAt as string) ?? new Date().toISOString();
        const connected = Boolean(loc.googlePlaceId || loc.ExternalConnection?.id);
        const avgRating = parseNumber(loc.reviewsAvg, 0);
        const totalReviews = parseNumber(loc.reviewsCount, 0);
        const monthlyReviews = 0; // si quieres, expón en el endpoint un campo con el conteo del mes
        const lastSync = timeAgoOrDash(loc.lastSyncAt ?? null);
        const status = (loc.status as string | null) ?? (connected ? "active" : "disconnected");
        const responseRate = 0; // idem, exponer métrica o calcular en API

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

  // Stats top (idénticos a tu mock pero desde rows)
  const totalLocations = rows.length;
  const totalConnected = rows.filter((l) => l.connected).length;
  const averageRating =
    rows.length > 0 ? (rows.reduce((acc, l) => acc + l.avgRating, 0) / rows.length).toFixed(1) : "—";
  const totalReviews = rows.reduce((acc, l) => acc + l.totalReviews, 0);

  return (
    <Layout
      title="Base de Datos"
      subtitle="Gestiona y monitorea todas las ubicaciones registradas"
      showCreateButton={true}
      createButtonText="Nueva Ubicación"
      onCreateClick={() => console.log("Crear nueva ubicación")}
    >
      <div className="p-6 space-y-6">
        {/* Errores */}
        {error && (
          <Card className="p-4 text-sm text-red-600">
            {error}
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <div className="h-3 w-3 bg-green-500 rounded-full" />
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
                <p className="text-2xl font-bold">
                  {loading ? "—" : averageRating}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Reviews Totales</p>
                <p className="text-2xl font-bold">
                  {loading ? "—" : totalReviews}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Locations Table */}
        <Card>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Ubicaciones Registradas</h3>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <div className="h-2 w-2 bg-green-500 rounded-full" />
                <span>Conectado</span>
                <div className="h-2 w-2 bg-red-500 rounded-full ml-4" />
                <span>Desconectado</span>
              </div>
            </div>

            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Ubicación</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Creada</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-center">Rating</TableHead>
                    <TableHead className="text-center">Reviews</TableHead>
                    <TableHead className="text-center">Este Mes</TableHead>
                    <TableHead className="text-center">% Respuestas</TableHead>
                    <TableHead>Última Sync</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={`s-${i}`}>
                        <TableCell colSpan={10}>
                          <div className="h-10 w-full animate-pulse bg-muted/40 rounded" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-sm text-muted-foreground py-6">
                        No hay ubicaciones todavía.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((location) => (
                      <TableRow
                        key={location.id}
                        className={`cursor-pointer transition-colors ${
                          selectedLocation === location.id ? "bg-muted/50" : "hover:bg-muted/30"
                        }`}
                        onClick={() => setSelectedLocation(location.id)}
                      >
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div
                              className={`h-2 w-2 rounded-full ${
                                location.connected ? "bg-green-500" : "bg-red-500"
                              }`}
                            />
                            <div>
                              <p className="font-medium">{location.name}</p>
                              <p className="text-sm text-muted-foreground">{location.address}</p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline">{location.category}</Badge>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {new Date(location.createdAt).toLocaleDateString("es-ES")}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          {getStatusBadge(location.status, location.connected)}
                        </TableCell>

                        <TableCell className="text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <Star
                              className={`h-4 w-4 ${getRatingColor(location.avgRating)}`}
                            />
                            <span
                              className={`font-medium ${getRatingColor(location.avgRating)}`}
                            >
                              {location.avgRating.toFixed(1)}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="text-center font-medium">
                          {location.totalReviews}
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge variant={location.monthlyReviews > 0 ? "default" : "secondary"}>
                            {location.monthlyReviews > 0 ? `+${location.monthlyReviews}` : "0"}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-center">
                          <div
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              location.responseRate >= 90
                                ? "bg-green-100 text-green-700"
                                : location.responseRate >= 70
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {location.responseRate}%
                          </div>
                        </TableCell>

                        <TableCell className="text-sm text-muted-foreground">
                          {location.lastSync}
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <Button variant="ghost" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
