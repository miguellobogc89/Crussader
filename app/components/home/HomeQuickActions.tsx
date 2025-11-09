// app/components/home/HomeQuickActions.tsx

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Users, Calendar, TrendingUp, Building2 } from "lucide-react";

export default function HomeQuickActions() {
  return (
    <Card className="border-2 border-dashed">
      <CardHeader>
        <CardTitle>Accesos rápidos</CardTitle>
        <CardDescription>
          Navega a las secciones clave de tu cuenta.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
            <Link href="/dashboard/reviews">
              <Users className="h-6 w-6" />
              <span>Ver reseñas</span>
            </Link>
          </Button>

          <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
            <Link href="/dashboard/calendar">
              <Calendar className="h-6 w-6" />
              <span>Calendario</span>
            </Link>
          </Button>

          <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
            <Link href="/dashboard/reports">
              <TrendingUp className="h-6 w-6" />
              <span>Informes</span>
            </Link>
          </Button>

          <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
            <Link href="/dashboard/settings">
              <Building2 className="h-6 w-6" />
              <span>Configuración</span>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
