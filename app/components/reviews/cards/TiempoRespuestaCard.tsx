"use client";

import { Card, CardContent } from "@/app/components/ui/card";
import { TrendingUp, TrendingDown, Timer } from "lucide-react";

type Trend = "up" | "down";

export default function TiempoRespuestaCard({
  value,
  change,
  trend,
  className,
}: {
  value: string;
  change: string;
  trend: Trend;
  className?: string;
}) {
  function TrendPill({ change, trend }: { change: string; trend: Trend }) {
    const Icon = trend === "up" ? TrendingUp : TrendingDown;
    const color = trend === "up" ? "text-success" : "text-destructive";
    return (
      <div className={`flex items-center space-x-1 ${color}`}>
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">{change}</span>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Tiempo Respuesta</p>
            <div className="flex items-center space-x-2">
              <p className="text-2xl font-bold">{value}</p>
              <TrendPill change={change} trend={trend} />
            </div>
          </div>
          <div className="rounded-full bg-muted/50 p-3 text-accent">
            <Timer className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
