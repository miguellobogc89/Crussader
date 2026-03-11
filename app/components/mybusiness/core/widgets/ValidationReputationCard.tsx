// app/components/mybusiness/core/widgets/ValidationReputationCard.tsx
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import MetricKpi from "../shared/MetricKpi";

export default function ValidationReputationCard() {
  return (
    <Card className="border-slate-200/70">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Validación & reputación</CardTitle>
          <Button size="sm" variant="ghost" className="text-slate-600">
            Ver
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <MetricKpi label="Rating medio" value="4.6" trend={{ dir: "up", text: "+0.1" }} />
          <MetricKpi label="Volumen" value="128" trend={{ dir: "up", text: "+12%" }} />
          <MetricKpi label="1⭐ sin respuesta" value="2" trend={{ dir: "down", text: "-1" }} />
          <MetricKpi label="Tiempo de respuesta" value="3h" trend={{ dir: "flat", text: "≈" }} />
        </div>
        <p className="text-sm text-slate-600">
          En salud/estética, la velocidad de respuesta y el manejo de 1⭐ tienen impacto directo en conversión.
        </p>
      </CardContent>
    </Card>
  );
}