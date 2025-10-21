"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Check } from "lucide-react";

export type Plan = {
  name: "Starter" | "Growth" | "Business";
  price: number;
  period: "mes";
  description: string;
  locations: number;
  users: number;
  trial?: string;
  badge?: string;
  popular?: boolean;
};

export function SelectedPlanCard({
  plan,
  features,
}: {
  plan: Plan;
  features: string[];
}) {
  return (
    <Card className="border-2 border-primary shadow-[0_0_30px_hsl(var(--primary)/0.15)] animate-fade-in">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl mb-2">Plan {plan.name}</CardTitle>
            <CardDescription>{plan.description}</CardDescription>
          </div>
          {plan.badge && (
            <Badge className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] text-primary-foreground">
              {plan.badge}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] bg-clip-text text-transparent">
            {plan.price}€
          </span>
          <span className="text-muted-foreground text-lg">/{plan.period}</span>
          {plan.trial && (
            <Badge variant="secondary" className="ml-auto">
              {plan.trial}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Ubicaciones</p>
            <p className="text-xl font-semibold">{plan.locations}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Usuarios</p>
            <p className="text-xl font-semibold">{plan.users}</p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="font-semibold text-sm">Todo incluido:</p>
          {features.map((feature) => (
            <div key={feature} className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                <Check className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
