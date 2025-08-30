"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  Plus,
  Users,
  Star,
  TrendingUp,
  Wifi,
  WifiOff,
  Settings,
  BarChart3,
  Calendar,
} from "lucide-react";

// --- Mock data (luego lo conectamos a tu API) ---
const companyData = {
  name: "Mi Empresa",
  email: "migc891@gmail.com",
  phone: "+34 954 123 456",
  address: "Sevilla, España",
  employees: 15,
  totalEstablishments: 4,
  totalReviews: 342,
  averageRating: 4.2,
  monthlyGrowth: "+12%",
};

type Status = "connected" | "disconnected" | "pending";

const establishments: Array<{
  id: number;
  name: string;
  address: string;
  rating: number;
  reviewCount: number;
  status: Status;
  lastSync: string;
  monthlyReviews: number;
  category: string; // "🛍️ Retail"
}> = [
  {
    id: 1,
    name: "Tienda 1",
    address: "Calle Fernández de Ribera 16B, 7D, Sevilla, 41005",
    rating: 4.5,
    reviewCount: 127,
    status: "connected",
    lastSync: "Hace 2h",
    monthlyReviews: 23,
    category: "🛍️ Retail",
  },
  {
    id: 2,
    name: "Location 1",
    address: "Plaza Nueva 8, Sevilla, 41001",
    rating: 3.7,
    reviewCount: 89,
    status: "disconnected",
    lastSync: "Hace 5 días",
    monthlyReviews: 12,
    category: "🍕 Restaurante",
  },
  {
    id: 3,
    name: "Café Central",
    address: "Calle Sierpes 45, Sevilla, 41004",
    rating: 4.8,
    reviewCount: 156,
    status: "connected",
    lastSync: "Hace 30min",
    monthlyReviews: 31,
    category: "☕ Cafetería",
  },
  {
    id: 4,
    name: "Spa Wellness",
    address: "Avenida de la Constitución 12, Sevilla, 41003",
    rating: 4.1,
    reviewCount: 78,
    status: "pending",
    lastSync: "Configurando...",
    monthlyReviews: 8,
    category: "💆‍♀️ Spa",
  },
];

function getStatusBadge(status: Status) {
  switch (status) {
    case "connected":
      return (
        <Badge className="bg-success text-success-foreground">
          <Wifi size={12} className="mr-1" />
          Conectado
        </Badge>
      );
    case "disconnected":
      return (
        <Badge variant="destructive">
          <WifiOff size={12} className="mr-1" />
          Desconectado
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-warning text-warning-foreground">
          <Settings size={12} className="mr-1" />
          Configurando
        </Badge>
      );
    default:
      return <Badge variant="secondary">Desconocido</Badge>;
  }
}

export default function CompanyTestPage() {
  return (
    <div className="min-h-screen bg-muted/20">
      {/* Cabecera simple como el resto de páginas */}
      <header className="border-b bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
        <div className="container mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mi empresa</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestiona tu empresa y todos sus establecimientos
            </p>
          </div>
          <Button
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            onClick={() => console.log("Añadir establecimiento")}
          >
            Añadir Establecimiento
          </Button>
        </div>
      </header>

      {/* Contenido */}
      <main>
        <div className="container mx-auto px-6 py-6 space-y-8 animate-fade-in">
          {/* Overview cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <Card className="relative overflow-hidden bg-gradient-to-br from-card via-card to-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5 text-primary" />
                  Información General
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">{companyData.name}</h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Mail size={14} />
                      <span>{companyData.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={14} />
                      <span>{companyData.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} />
                      <span>{companyData.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={14} />
                      <span>{companyData.employees} empleados</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-gradient-to-br from-card via-card to-success/10">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="h-5 w-5 text-success" />
                  Establecimientos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-success">{companyData.totalEstablishments}</div>
                <p className="text-sm text-muted-foreground">Ubicaciones activas</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-gradient-to-br from-card via-card to-warning/10">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Star className="h-5 w-5 text-warning" />
                  Rating Promedio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-warning">{companyData.averageRating}</div>
                <p className="text-sm text-muted-foreground">{companyData.totalReviews} reseñas totales</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-gradient-to-br from-card via-card to-primary/10">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Crecimiento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{companyData.monthlyGrowth}</div>
                <p className="text-sm text-muted-foreground">Este mes</p>
              </CardContent>
            </Card>
          </div>

          {/* Establishments list */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Establecimientos</CardTitle>
                  <CardDescription>Gestiona todas las ubicaciones de tu empresa</CardDescription>
                </div>
                <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                  <Plus size={16} className="mr-2" />
                  Añadir Ubicación
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {establishments.map((establishment, index) => (
                  <Card
                    key={establishment.id}
                    className="relative overflow-hidden hover:shadow-lg transition-all duration-300 animate-slide-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{establishment.category.split(" ")[0]}</span>
                            <div>
                              <h3 className="font-semibold text-lg">{establishment.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {establishment.category.split(" ").slice(1).join(" ")}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin size={14} />
                            <span>{establishment.address}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Star size={16} className="fill-warning text-warning" />
                              <span className="font-semibold">{establishment.rating}</span>
                              <span className="text-muted-foreground">
                                ({establishment.reviewCount} reseñas)
                              </span>
                            </div>

                            <div className="flex items-center gap-1 text-sm">
                              <Calendar size={14} className="text-muted-foreground" />
                              <span className="text-muted-foreground">
                                {establishment.monthlyReviews} este mes
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col md:items-end gap-3">
                          {getStatusBadge(establishment.status)}

                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Última sincronización</p>
                            <p className="text-sm font-medium">{establishment.lastSync}</p>
                          </div>

                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Settings size={14} className="mr-1" />
                              Configurar
                            </Button>
                            <Button
                              size="sm"
                              variant={establishment.status === "connected" ? "secondary" : "default"}
                              className={
                                establishment.status === "connected"
                                  ? ""
                                  : "bg-primary hover:bg-primary/90"
                              }
                            >
                              {establishment.status === "connected" ? "Gestionar" : "Conectar"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
