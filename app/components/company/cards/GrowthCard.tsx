// app/components/company/cards/GrowthCard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { TrendingUp } from "lucide-react";

type Props = { growthText: string; caption?: string };

export function GrowthCard({ growthText, caption = "Variación respecto al mes anterior" }: Props) {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-card via-card to-primary/10">
      
      {/* Icono decorativo */}
      <TrendingUp
        className="
          pointer-events-none absolute
          -right-4 -bottom-4
          h-16 w-16
          text-primary/20
        "
      />

      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          Crecimiento
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="text-3xl font-bold text-primary">{growthText}</div>

        {/* ⬇️ La explicación importante */}
        <p className="text-sm text-muted-foreground">{caption}</p>
      </CardContent>
    </Card>
  );
}
