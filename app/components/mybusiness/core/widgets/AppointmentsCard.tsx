// app/components/mybusiness/core/widgets/AppointmentsCard.tsx
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import MetricKpi from "../shared/MetricKpi";

export default function AppointmentsCard() {
  return (
    <Card className="border-slate-200/70">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Citas</CardTitle>
          <Button size="sm" variant="ghost" className="text-slate-600">
            Ver
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <MetricKpi label="Pendientes" value="9" trend={{ dir: "up", text: "+2" }} />
          <MetricKpi label="Confirmadas" value="41" trend={{ dir: "up", text: "+8%" }} />
          <MetricKpi label="Esta semana" value="64" trend={{ dir: "flat", text: "≈" }} />
          <MetricKpi label="Lista de espera" value="6" trend={{ dir: "up", text: "+1" }} />
        </div>
        <p className="text-sm text-slate-600">
          Mock: pendientes/confirmadas/reprogramadas/canceladas + “huecos perdidos” y reglas del cerebro.
        </p>
      </CardContent>
    </Card>
  );
}