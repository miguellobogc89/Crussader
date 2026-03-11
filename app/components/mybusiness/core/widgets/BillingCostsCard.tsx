// app/components/mybusiness/core/widgets/BillingCostsCard.tsx
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import MetricKpi from "../shared/MetricKpi";

export default function BillingCostsCard() {
  return (
    <Card className="border-slate-200/70">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Facturación & costes</CardTitle>
          <Button size="sm" variant="ghost" className="text-slate-600">
            Ver
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <MetricKpi label="Ingresos estimados" value="12.4k€" trend={{ dir: "up", text: "+6%" }} />
          <MetricKpi label="Cancelaciones" value="14" trend={{ dir: "down", text: "-3" }} />
          <MetricKpi label="No-shows" value="3" trend={{ dir: "flat", text: "≈" }} />
          <MetricKpi label="Costes (aprox.)" value="2.1k€" trend={{ dir: "up", text: "+4%" }} />
        </div>
        <p className="text-sm text-slate-600">
          Mock: aquí saldrán ingresos desde citas confirmadas + ajustes (cancelación/no-show) y costes (fees, ads, etc.).
        </p>
      </CardContent>
    </Card>
  );
}