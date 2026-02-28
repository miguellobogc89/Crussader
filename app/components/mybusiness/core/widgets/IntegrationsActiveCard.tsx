// app/components/mybusiness/core/widgets/IntegrationsActiveCard.tsx
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";

function Row({
  name,
  status,
  note,
}: {
  name: string;
  status: "ok" | "warn" | "off";
  note?: string;
}) {
  const badge =
    status === "ok" ? (
      <Badge className="bg-emerald-600">OK</Badge>
    ) : status === "warn" ? (
      <Badge variant="secondary">Warning</Badge>
    ) : (
      <Badge variant="outline">Off</Badge>
    );

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div>
        <p className="text-sm font-medium text-slate-900">{name}</p>
        {note && <p className="text-xs text-slate-500">{note}</p>}
      </div>
      {badge}
    </div>
  );
}

export default function IntegrationsActiveCard() {
  return (
    <Card className="border-slate-200/70">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Integraciones activas</CardTitle>
          <Button size="sm" variant="ghost" className="text-slate-600">
            Gestionar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="divide-y divide-slate-200/70">
        <Row name="Google Business Profile" status="ok" note="Reviews y respuestas" />
        <Row name="WhatsApp (Meta)" status="warn" note="Webhook OK · token DEV" />
        <Row name="Calendario" status="off" note="Conecta para disponibilidad real" />
        <Row name="Pagos" status="off" note="Para depósitos / no-show" />
      </CardContent>
    </Card>
  );
}