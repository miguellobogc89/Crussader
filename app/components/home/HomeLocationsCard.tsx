// app/components/home/HomeLocationsCard.tsx

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { MapPin, ChevronRight } from "lucide-react";

type Location = {
  id: number;
  name: string;
  city: string;
  reviews: number;
};

export default function HomeLocationsCard({ locations }: { locations: Location[] }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <CardTitle>Ubicaciones activas</CardTitle>
          </div>
          <Badge variant="outline">{locations.length}</Badge>
        </div>
        <CardDescription>Establecimientos conectados</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {locations.map((l) => (
            <div
              key={l.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <div>
                  <p className="font-medium">{l.name}</p>
                  <p className="text-sm text-muted-foreground">{l.city}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{l.reviews}</p>
                <p className="text-xs text-muted-foreground">reseñas</p>
              </div>
            </div>
          ))}
        </div>

        <Button variant="ghost" className="w-full mt-4" asChild>
          <Link href="/dashboard/company">
            Gestionar ubicaciones
            <ChevronRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
