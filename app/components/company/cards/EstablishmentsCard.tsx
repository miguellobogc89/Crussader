"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { BarChart3 } from "lucide-react";

type Props = { count: number | string; subtitle?: string };
export function EstablishmentsCard({ count, subtitle = "Ubicaciones activas" }: Props) {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-card via-card to-success/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5 text-success" />
          Establecimientos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-success">{count}</div>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
