// app/components/mybusiness/core/widgets/CustomersCard.tsx
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import MetricKpi from "../shared/MetricKpi";

export default function CustomersCard() {
  return (
    <Card className="border-slate-200/70">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Clientes</CardTitle>
          <Button size="sm" variant="ghost" className="text-slate-600">
            Ver
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <MetricKpi label="Nuevos" value="23" trend={{ dir: "up", text: "+5" }} />
          <MetricKpi label="Recurrentes" value="61" trend={{ dir: "up", text: "+4%" }} />
          <MetricKpi label="Bajas (proxy)" value="6" trend={{ dir: "flat", text: "≈" }} />
          <MetricKpi label="Riesgo" value="4" trend={{ dir: "up", text: "+1" }} />
        </div>
        <p className="text-sm text-slate-600">
          Mock: cohortes, retención, tags clínicos/servicio y segmentos por valor.
        </p>
      </CardContent>
    </Card>
  );
}