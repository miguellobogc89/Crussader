// app/dashboard/home/components/EstablishmentsCard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { BarChart3 } from "lucide-react";

type Props = { count: number | string; subtitle?: string };

export function EstablishmentsCard({ count, subtitle = "Ubicaciones activas" }: Props) {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-white via-white to-sky-50 border border-slate-100 shadow-card">
      {/* Imagen decorativa de fondo, misma lógica/dimensiones que CompanyInfoCard */}
      <BarChart3
        className="
          pointer-events-none absolute
          -right-6 -bottom-6
          h-24 w-24
          text-success/20
        "
      />

      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-slate-900">
          <BarChart3 className="h-5 w-5 text-success" />
          Establecimientos
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0 pb-3 space-y-1">
        <div className="text-3xl font-bold text-success">{count}</div>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
