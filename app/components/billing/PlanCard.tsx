// app/components/billing/PlanCard.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Check } from "lucide-react";

export type PlanCardProps = {
  name: string;
  price: string;
  period: string;
  description: string;
  locations: number;
  users: number;
  trial?: string;
  badge?: string;
  highlight?: string;
  popular?: boolean;
  variant?: "default" | "outline";
  features: string[];
  onSelect: () => void;
  cta: string;
};

export function PlanCard({
  name,
  price,
  period,
  description,
  locations,
  users,
  trial,
  badge,
  highlight,
  popular,
  variant = "outline",
  features,
  onSelect,
  cta,
}: PlanCardProps) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " " ? onSelect() : null)}
      className={[
        "relative h-full cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1",
        "focus:outline-none focus:ring-2 focus:ring-primary/50",
        "flex flex-col",
        popular
          ? "border-primary shadow-[0_0_40px_hsl(var(--primary)/0.2)] scale-[1.02]"
          : "hover:border-primary/50",
      ].join(" ")}
    >
      {badge && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
          <Badge className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] text-primary-foreground px-4 py-1 shadow-lg">
            {badge}
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pt-8 pb-4">
        <CardTitle className="text-2xl font-bold mb-2">{name}</CardTitle>
        <CardDescription className="text-sm mb-4">{description}</CardDescription>
        <div className="mb-2">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-5xl font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] bg-clip-text text-transparent">
              {price}€
            </span>
            <span className="text-muted-foreground">/{period}</span>
          </div>
          {trial && <p className="text-sm text-primary font-medium mt-2">{trial}</p>}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 gap-6 pb-6">
        {/* Datos de volumen */}
        <div className="space-y-2 pb-4 border-b">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Ubicaciones</span>
            <span className="font-semibold">{locations}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Usuarios</span>
            <span className="font-semibold">{users}</span>
          </div>
          {highlight && (
            <div className="pt-2">
              <Badge variant="secondary" className="text-xs">
                {highlight}
              </Badge>
            </div>
          )}
        </div>

        {/* Features ocupa el espacio flexible */}
        <div className="space-y-3 flex-1">
          {features.map((f) => (
            <div key={f} className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                <Check className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm text-foreground/90">{f}</span>
            </div>
          ))}
        </div>

        {/* CTA anclado abajo */}
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          variant={variant}
          size="lg"
          className={[
            "w-full mt-auto font-semibold",
            popular
              ? "bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] hover:opacity-90 text-primary-foreground shadow-lg hover:shadow-xl"
              : "",
          ].join(" ")}
        >
          {cta}
        </Button>
      </CardContent>
    </Card>
  );
}
