// app/components/mybusiness/core/widgets/CapacityUtilizationCard.tsx
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import MetricKpi from "../shared/MetricKpi";
import { Button } from "@/app/components/ui/button";

export default function CapacityUtilizationCard() {
  return (
    <Card className="border-slate-200/70">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Capacidad & ocupación</CardTitle>
          <Button size="sm" variant="ghost" className="text-slate-600">
            Ver
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <MetricKpi label="Ocupación (semana)" value="78%" trend={{ dir: "up", text: "+4%" }} />
          <MetricKpi label="Huecos perdidos" value="6" trend={{ dir: "down", text: "-2" }} />
        </div>

        {/* Simple sparkline mock */}
        <div className="rounded-xl border border-slate-200/70 bg-white p-3">
          <p className="text-xs text-slate-500">Ocupación diaria (mock)</p>
          <div className="mt-2 grid grid-cols-7 gap-2 items-end h-16">
            {[50, 72, 80, 66, 92, 74, 58].map((v, i) => (
              <div key={i} className="w-full">
                <div
                  className="w-full rounded-md bg-slate-200"
                  style={{ height: `${v}%` }}
                />
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-slate-600">
          Mock: base para el motor de optimización (agrupar servicios, reducir huecos, activar lista de espera).
        </p>
      </CardContent>
    </Card>
  );
}