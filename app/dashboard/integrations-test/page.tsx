// app/dashboard/integrations/page.tsx
"use client";

import SectionLayout from "@/app/components/layouts/SectionLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Switch } from "@/app/components/ui/switch";
import {
  Store,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Settings,
  ExternalLink,
  Plug,
  Wifi,
  WifiOff,
} from "lucide-react";
import type { JSX } from "react";

/* ===================== Tipos ===================== */
type PlatformStatus = "connected" | "warning" | "error" | "available";

type ConnectedPlatform = {
  name: string;
  logo: string;
  status: Exclude<PlatformStatus, "available">;
  reviewCount: number;
  issue?: string;
};

type AvailablePlatform = {
  name: string;
  logo: string;
  status: "available";
};

type LocationRow = {
  id: number | string;
  name: string;
  address: string;
  type: string;
  totalReviews: number;
  avgRating: number;
  platforms: {
    connected: ConnectedPlatform[];
    available: AvailablePlatform[];
  };
};

/* ===================== Mock data ===================== */
const locations: LocationRow[] = [
  {
    id: 1,
    name: "Bella Vista Restaurant",
    address: "Calle Gran Vía 25, Madrid",
    type: "Restaurante",
    totalReviews: 247,
    avgRating: 4.3,
    platforms: {
      connected: [
        { name: "Google Business", logo: "🏢", status: "connected", reviewCount: 156 },
        { name: "TripAdvisor", logo: "🦉", status: "connected", reviewCount: 91 },
      ],
      available: [
        { name: "Yelp", logo: "🔴", status: "available" },
        { name: "Facebook", logo: "📘", status: "available" },
        { name: "OpenTable", logo: "🍽️", status: "available" },
      ],
    },
  },
  {
    id: 2,
    name: "Café Central",
    address: "Plaza del Sol 12, Madrid",
    type: "Cafetería",
    totalReviews: 89,
    avgRating: 4.7,
    platforms: {
      connected: [
        { name: "Google Business", logo: "🏢", status: "connected", reviewCount: 67 },
        { name: "Facebook", logo: "📘", status: "connected", reviewCount: 22 },
      ],
      available: [
        { name: "TripAdvisor", logo: "🦉", status: "available" },
        { name: "Yelp", logo: "🔴", status: "available" },
        { name: "Foursquare", logo: "📍", status: "available" },
      ],
    },
  },
  {
    id: 3,
    name: "Taco Loco",
    address: "Avenida de la Paz 87, Madrid",
    type: "Restaurante Mexicano",
    totalReviews: 142,
    avgRating: 4.1,
    platforms: {
      connected: [
        { name: "Google Business", logo: "🏢", status: "warning", reviewCount: 98, issue: "API limits exceeded" },
      ],
      available: [
        { name: "TripAdvisor", logo: "🦉", status: "available" },
        { name: "Yelp", logo: "🔴", status: "available" },
        { name: "Facebook", logo: "📘", status: "available" },
        { name: "Just Eat", logo: "🛵", status: "available" },
      ],
    },
  },
];

/* ===================== Helpers ===================== */
function getStatusIcon(status: PlatformStatus): JSX.Element {
  switch (status) {
    case "connected":
      return <CheckCircle2 className="h-4 w-4 text-success" />;
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-warning" />;
    case "error":
      return <XCircle className="h-4 w-4 text-destructive" />;
    default:
      return <Plug className="h-4 w-4 text-muted-foreground" />;
  }
}

function getStatusBadge(status: PlatformStatus): JSX.Element {
  switch (status) {
    case "connected":
      return <Badge className="bg-success text-success-foreground">Conectada</Badge>;
    case "warning":
      return <Badge className="bg-warning text-warning-foreground">Atención</Badge>;
    case "error":
      return <Badge variant="destructive">Error</Badge>;
    default:
      return <Badge variant="outline">Disponible</Badge>;
  }
}

/* ===================== Page ===================== */
export default function IntegrationsPage() {
  return (
    <SectionLayout
      icon={Plug}
      title="Integraciones"
      subtitle="Gestiona las conexiones de tus ubicaciones con plataformas de reseñas"
      headerContent={
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4 w-full">
          <Card className="border-success/20 bg-gradient-to-br from-success/10 to-success/5">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Wifi className="h-5 w-5 text-success" />
                <div>
                  <p className="text-sm font-medium text-success">Conectadas</p>
                  <p className="text-2xl font-bold text-success">5</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-warning/20 bg-gradient-to-br from-warning/10 to-warning/5">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <div>
                  <p className="text-sm font-medium text-warning">Con avisos</p>
                  <p className="text-2xl font-bold text-warning">1</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted/20 bg-gradient-to-br from-muted/10 to-muted/5">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <WifiOff className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Disponibles</p>
                  <p className="text-2xl font-bold text-muted-foreground">11</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-accent/5">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Store className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-primary">Ubicaciones</p>
                  <p className="text-2xl font-bold text-primary">3</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      {/* Ubicaciones */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Ubicaciones</h2>
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            Configurar todas
          </Button>
        </div>

        {locations.map((location) => (
          <Card key={location.id} className="rounded-2xl border-0 shadow-[var(--shadow-elegant)]">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5 text-primary" />
                    {location.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {location.address}
                  </CardDescription>
                </div>
                <Badge variant="secondary">{location.type}</Badge>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <div className="text-sm">
                  <span className="font-medium">{location.totalReviews}</span>
                  <span className="text-muted-foreground"> reseñas totales</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">{location.avgRating}/5</span>
                  <span className="text-muted-foreground"> puntuación media</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Conectadas */}
              {location.platforms.connected.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                    Plataformas Conectadas
                  </h4>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {location.platforms.connected.map((platform, idx) => (
                      <div
                        key={`${platform.name}-${idx}`}
                        className="flex items-center justify-between rounded-xl border border-muted/50 bg-muted/30 p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{platform.logo}</div>
                          <div>
                            <p className="text-sm font-medium">{platform.name}</p>
                            <p className="text-xs text-muted-foreground">{platform.reviewCount} reseñas</p>
                            {platform.issue && (
                              <p className="text-xs font-medium text-warning">{platform.issue}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(platform.status)}
                          {getStatusBadge(platform.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Disponibles */}
              {location.platforms.available.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                    Plataformas Disponibles
                  </h4>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
                    {location.platforms.available.map((platform, idx) => (
                      <Button
                        key={`${platform.name}-${idx}`}
                        variant="outline"
                        className="h-auto flex-col space-y-2 p-4 transition-all duration-200 hover:border-primary/30 hover:bg-primary/5"
                      >
                        <div className="text-2xl">{platform.logo}</div>
                        <span className="text-center text-xs font-medium">{platform.name}</span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Plug className="h-3 w-3" />
                          Conectar
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between border-t border-muted/50 pt-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch id={`sync-${location.id}`} />
                    <label htmlFor={`sync-${location.id}`} className="text-sm font-medium">
                      Sincronización automática
                    </label>
                  </div>
                </div>
                <Button variant="ghost" className="gap-2 text-primary">
                  <Settings className="h-4 w-4" />
                  Configurar
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Help */}
      <section>
        <Card className="rounded-2xl border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-primary/10 p-2">
                <Plug className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">¿Necesitas ayuda con las integraciones?</h3>
                <p className="text-sm text-muted-foreground">
                  Conecta tus ubicaciones con las principales plataformas de reseñas para gestionar toda tu reputación
                  online desde un solo lugar.
                </p>
                <Button variant="outline" className="mt-3 gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Ver guía de configuración
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </SectionLayout>
  );
}
