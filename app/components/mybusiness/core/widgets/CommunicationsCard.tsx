// app/components/mybusiness/core/widgets/CommunicationsCard.tsx
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import MetricKpi from "../shared/MetricKpi";

export default function CommunicationsCard() {
  return (
    <Card className="border-slate-200/70">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Comunicaciones</CardTitle>
          <Button size="sm" variant="ghost" className="text-slate-600">
            Ver
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <MetricKpi label="Conversaciones activas" value="18" trend={{ dir: "up", text: "+3" }} />
          <MetricKpi label="IA calls" value="246" trend={{ dir: "up", text: "+9%" }} />
          <MetricKpi label="Citas creadas (WA)" value="7" trend={{ dir: "up", text: "+2" }} />
          <MetricKpi label="Modificadas (WA)" value="4" trend={{ dir: "flat", text: "≈" }} />
        </div>
        <p className="text-sm text-slate-600">
          Mock: métricas por canal (WhatsApp/voz/email) + errores de entrega y latencias.
        </p>
      </CardContent>
    </Card>
  );
}