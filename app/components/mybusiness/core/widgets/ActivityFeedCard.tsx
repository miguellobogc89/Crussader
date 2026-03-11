// app/components/mybusiness/core/widgets/ActivityFeedCard.tsx
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Separator } from "@/app/components/ui/separator";

function Item({
  title,
  meta,
}: {
  title: string;
  meta: string;
}) {
  return (
    <div className="py-3">
      <p className="text-sm font-medium text-slate-900">{title}</p>
      <p className="text-xs text-slate-500 mt-0.5">{meta}</p>
    </div>
  );
}

export default function ActivityFeedCard() {
  return (
    <Card className="border-slate-200/70">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Actividad reciente</CardTitle>
          <Button size="sm" variant="ghost" className="text-slate-600">
            Ver logs
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Item title="Cita confirmada" meta="Mar 10:30 · Higiene dental · WhatsApp" />
        <Separator />
        <Item title="Respuesta enviada a review" meta="⭐ 1 → respuesta publicada · 2m" />
        <Separator />
        <Item title="Cita reprogramada" meta="Jue 18:00 → Vie 17:30 · cliente existente" />
        <Separator />
        <Item title="Webhook WhatsApp OK" meta="Último evento hace 3 min" />
      </CardContent>
    </Card>
  );
}