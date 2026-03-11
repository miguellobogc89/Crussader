// app/components/mybusiness/core/widgets/RisksAlertsCard.tsx
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";

function AlertItem({
  title,
  meta,
  tone,
}: {
  title: string;
  meta: string;
  tone: "critical" | "warn" | "info";
}) {
  const badge =
    tone === "critical" ? (
      <Badge className="bg-rose-600">Crítico</Badge>
    ) : tone === "warn" ? (
      <Badge className="bg-amber-600">Atención</Badge>
    ) : (
      <Badge variant="secondary">Info</Badge>
    );

  return (
    <div className="rounded-xl border border-slate-200/70 p-3 bg-white">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="text-xs text-slate-500 mt-0.5">{meta}</p>
        </div>
        {badge}
      </div>
    </div>
  );
}

export default function RisksAlertsCard() {
  return (
    <Card className="border-slate-200/70">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Riesgos & alertas</CardTitle>
          <Button size="sm" variant="ghost" className="text-slate-600">
            Ver todo
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <AlertItem
          title="Citas mañana sin confirmar"
          meta="3 citas · prioriza confirmación por WhatsApp"
          tone="warn"
        />
        <AlertItem
          title="Review 1⭐ pendiente"
          meta="1 review · respuesta sugerida disponible"
          tone="critical"
        />
        <AlertItem
          title="Huecos perdidos esta semana"
          meta="Estimación: 6 huecos · activar lista de espera"
          tone="info"
        />
        <div className="pt-2 flex items-center gap-2">
          <Button size="sm" variant="outline">
            Abrir checklist
          </Button>
          <Button size="sm">Aplicar acciones</Button>
        </div>
        <p className="text-xs text-slate-500">
          Mock: este panel lo alimenta el “cerebro” con reglas + datos de agenda y reputación.
        </p>
      </CardContent>
    </Card>
  );
}