// app/components/home/HomeQuickStats.tsx

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Star, CheckCircle2, Clock, TrendingUp } from "lucide-react";

type Metrics = {
  avgRating: number;
  responseRate: number;
  avgResponseTime: string;
  newReviews: number;
};

type Company = {
  totalReviews: number;
};

type HomeQuickStatsProps = {
  metrics: Metrics;
  company: Company;
};

export default function HomeQuickStats({ metrics, company }: HomeQuickStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Valoración media */}
      <Card className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valoración media</CardTitle>
          <Star className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.avgRating}</div>
          <p className="text-xs text-muted-foreground">
            De {company.totalReviews} reseñas totales
          </p>
        </CardContent>
      </Card>

      {/* Tasa de respuesta */}
      <Card className="border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tasa de respuesta</CardTitle>
          <CheckCircle2 className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.responseRate}%</div>
          <p className="text-xs text-muted-foreground">
            Objetivo recomendado: 95%
          </p>
        </CardContent>
      </Card>

      {/* Tiempo de respuesta */}
      <Card className="border-l-4 border-l-sky-500 hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tiempo de respuesta</CardTitle>
          <Clock className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.avgResponseTime}</div>
          <p className="text-xs text-muted-foreground">
            Media en el último periodo
          </p>
        </CardContent>
      </Card>

      {/* Nuevas reseñas */}
      <Card className="border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Nuevas reseñas</CardTitle>
          <TrendingUp className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+{metrics.newReviews}</div>
          <p className="text-xs text-muted-foreground">Esta semana</p>
        </CardContent>
      </Card>
    </div>
  );
}
