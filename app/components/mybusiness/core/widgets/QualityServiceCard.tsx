// app/components/mybusiness/core/widgets/QualityServiceCard.tsx
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import MetricKpi from "../shared/MetricKpi";

export default function QualityServiceCard() {
  return (
    <Card className="border-slate-200/70">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Calidad del servicio</CardTitle>
          <Button size="sm" variant="ghost" className="text-slate-600">
            Ver
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <MetricKpi label="Quejas" value="2" trend={{ dir: "down", text: "-1" }} />
          <MetricKpi label="Retrabajos" value="3" trend={{ dir: "flat", text: "≈" }} />
          <MetricKpi label="Espera media" value="9m" trend={{ dir: "down", text: "-2m" }} />
          <MetricKpi label="Satisfacción" value="—" sub="Coming soon" trend={{ dir: "flat", text: "Soon" }} />
        </div>
        <p className="text-sm text-slate-600">
          Mock: en clínicas/estética, calidad + espera impactan reviews y retención. Aquí conectaremos incidencias y NPS/CSAT.
        </p>
      </CardContent>
    </Card>
  );
}