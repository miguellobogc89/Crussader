"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Separator } from "@/app/components/ui/separator";
import { Lock, User as UserIcon, MapPin, ChevronUp, ChevronDown } from "lucide-react";
import type { Plan } from "./SelectedPlanCard";

const PRICE_USER = 3.99;
const PRICE_LOCATION = 29;

export function OrderSummaryCard({
  plan,
  loading,
  errorMsg,
  onStartTrial,
}: {
  plan: Plan;
  loading: boolean;
  errorMsg: string | null;
  onStartTrial: (args: { extraUsers: number; extraLocations: number }) => void | Promise<void>;
}) {
  const [extraUsers, setExtraUsers] = useState(0);
  const [extraLocations, setExtraLocations] = useState(0);

  const usersAmount = useMemo(() => +(extraUsers * PRICE_USER).toFixed(2), [extraUsers]);
  const locationsAmount = useMemo(() => +(extraLocations * PRICE_LOCATION).toFixed(2), [extraLocations]);
  const subtotalCalc = useMemo(
    () => +(plan.price + usersAmount + locationsAmount).toFixed(2),
    [plan.price, usersAmount, locationsAmount]
  );
  const vatCalc = useMemo(() => +(subtotalCalc * 0.21).toFixed(2), [subtotalCalc]);
  const totalCalc = useMemo(() => +(subtotalCalc + vatCalc).toFixed(2), [subtotalCalc, vatCalc]);

  return (
    <Card className="shadow-xl animate-fade-in border-2" style={{ animationDelay: "50ms" }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary" />
          Resumen del pedido
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Plan base */}
        <div className="flex justify-between items-start">
          <div>
            <p className="font-medium">Plan {plan.name}</p>
            <p className="text-sm text-muted-foreground">Facturación mensual</p>
          </div>
          <p className="font-semibold">{plan.price.toFixed(2)}€</p>
        </div>

        {/* Extras compactos */}
        <div className="space-y-2">
          {/* Usuarios */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Usuarios</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setExtraUsers((n) => Math.max(0, n - 1))}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <span className="w-6 text-center text-sm font-medium">{extraUsers}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setExtraUsers((n) => n + 1)}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
              <div className="min-w-[72px] text-right text-sm tabular-nums">{usersAmount.toFixed(2)}€</div>
            </div>
          </div>

          {/* Ubicaciones */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Ubicaciones</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setExtraLocations((n) => Math.max(0, n - 1))}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <span className="w-6 text-center text-sm font-medium">{extraLocations}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setExtraLocations((n) => n + 1)}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
              <div className="min-w-[72px] text-right text-sm tabular-nums">{locationsAmount.toFixed(2)}€</div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Totales */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <p className="text-muted-foreground">Subtotal</p>
            <p className="font-medium">{subtotalCalc.toFixed(2)}€</p>
          </div>
          <div className="flex justify-between text-sm">
            <p className="text-muted-foreground">IVA (21%)</p>
            <p className="font-medium">{vatCalc.toFixed(2)}€</p>
          </div>
          <div className="flex justify-between items-center pt-1">
            <p className="text-lg font-bold">Total</p>
            <div className="text-right">
              <p className="text-2xl font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] bg-clip-text text-transparent">
                {totalCalc.toFixed(2)}€
              </p>
              <p className="text-xs text-muted-foreground">al mes</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Button
          onClick={() => onStartTrial({ extraUsers, extraLocations })}
          disabled={loading}
          className="w-full mt-2 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] hover:opacity-90 text-primary-foreground shadow-lg hover:shadow-xl font-semibold h-12"
        >
          {loading ? "Creando prueba..." : "Iniciar prueba gratuita"}
        </Button>

        {errorMsg && <p className="text-sm text-destructive mt-2 text-center animate-fade-in">{errorMsg}</p>}
      </CardContent>
    </Card>
  );
}
