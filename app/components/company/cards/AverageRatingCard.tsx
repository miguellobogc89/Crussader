// app/components/company/cards/AverageRatingCard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Star } from "lucide-react";

type Props = { average: number | string; totalReviews: number | string };

export function AverageRatingCard({ average, totalReviews }: Props) {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-card via-card to-warning/10">
      {/* Icono decorativo de fondo */}
      <Star className="pointer-events-none absolute -right-4 -bottom-4 h-16 w-16 text-warning/20" />

      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Star className="h-5 w-5 text-warning" />
          Rating promedio
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="text-3xl font-bold text-warning">{average}</div>
        <p className="text-sm text-muted-foreground">
          {totalReviews} reseñas totales
        </p>
      </CardContent>
    </Card>
  );
}
