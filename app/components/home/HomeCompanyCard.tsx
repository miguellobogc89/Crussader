// app/components/home/HomeCompanyCard.tsx

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Building2, ChevronRight } from "lucide-react";

type Company = {
  name: string;
  industry: string;
  locations: number;
  totalReviews: number;
};

type User = {
  memberSince: string;
};

export default function HomeCompanyCard({ company, user }: { company: Company; user: User }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <CardTitle>Datos de la empresa</CardTitle>
        </div>
        <CardDescription>{company.name}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Sector</p>
            <p className="font-medium">{company.industry}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Ubicaciones</p>
            <p className="font-medium">{company.locations}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Reseñas totales</p>
            <p className="font-medium">{company.totalReviews}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Cliente desde</p>
            <p className="font-medium">{user.memberSince}</p>
          </div>
        </div>

        <Button variant="outline" className="w-full" asChild>
          <Link href="/dashboard/company">
            Ver detalles completos
            <ChevronRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
