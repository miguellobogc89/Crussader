// app/components/settings/UserTab.tsx
"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Progress } from "@/app/components/ui/progress";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Separator } from "@/app/components/ui/separator";
import { CreditCard, Check, AlertTriangle, Calendar } from "lucide-react";

export default function UserTab() {
  const currentPlan = useMemo(
    () => ({
      name: "Pro",
      price: "29€",
      period: "mes",
      responses: { current: 847, limit: 1000 },
      establishments: { current: 3, limit: 5 },
      trialDays: null as number | null,
    }),
    []
  );

  const plans = useMemo(
    () => [
      {
        id: "basic",
        name: "Básico",
        price: "9€",
        period: "mes",
        current: false,
        features: ["Hasta 200 respuestas/mes", "1 establecimiento", "Soporte por email"],
      },
      {
        id: "pro",
        name: "Pro",
        price: "29€",
        period: "mes",
        current: true,
        popular: true,
        features: ["Hasta 1,000 respuestas/mes", "5 establecimientos", "Soporte prioritario", "Análisis avanzados"],
      },
      {
        id: "business",
        name: "Business",
        price: "79€",
        period: "mes",
        current: false,
        features: [
          "Respuestas ilimitadas",
          "Establecimientos ilimitados",
          "Soporte 24/7",
          "API personalizada",
          "Manager dedicado",
        ],
      },
    ],
    []
  );

  const invoiceHistory = useMemo(
    () => [
      { date: "2024-12-01", concept: "Plan Pro - Diciembre", amount: "29,00€", status: "paid" },
      { date: "2024-11-01", concept: "Plan Pro - Noviembre", amount: "29,00€", status: "paid" },
      { date: "2024-10-01", concept: "Plan Pro - Octubre", amount: "29,00€", status: "paid" },
    ],
    []
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold tracking-tight mb-2">Facturación y planes</h2>
        <p className="text-muted-foreground text-sm">Gestiona tu suscripción, métodos de pago e historial de facturas.</p>
      </div>

      {/* Plan actual */}
      <Card className="rounded-2xl shadow-sm border-0 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Plan actual</CardTitle>
            <Badge className="bg-primary/20 text-primary border-primary/30">Activo</Badge>
          </div>
          <CardDescription>
            Plan {currentPlan.name} • {currentPlan.price}/{currentPlan.period}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Uso de respuestas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <Label>Respuestas utilizadas</Label>
              <span className="text-muted-foreground">
                {currentPlan.responses.current.toLocaleString()} / {currentPlan.responses.limit.toLocaleString()}
              </span>
            </div>
            <Progress value={(currentPlan.responses.current / currentPlan.responses.limit) * 100} className="h-2" />
          </div>

          {/* Uso de establecimientos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <Label>Establecimientos configurados</Label>
              <span className="text-muted-foreground">
                {currentPlan.establishments.current} / {currentPlan.establishments.limit}
              </span>
            </div>
            <Progress value={(currentPlan.establishments.current / currentPlan.establishments.limit) * 100} className="h-2" />
          </div>

          {/* Aviso de límite */}
          <div className="flex items-start space-x-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Te quedan 153 respuestas este mes</p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Considera actualizar a Business para respuestas ilimitadas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cambiar plan */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Cambiar plan</CardTitle>
          <CardDescription>Actualiza o cambia tu plan según tus necesidades</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative p-6 rounded-2xl border transition-all duration-200 ${
                  plan.current ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:shadow-md"
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-2 left-6 bg-primary text-primary-foreground">Popular</Badge>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{plan.name}</h3>
                    <div className="flex items-baseline space-x-1">
                      <span className="text-2xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">/{plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button variant={plan.current ? "outline" : "default"} className="w-full rounded-xl" disabled={plan.current}>
                    {plan.current ? "Plan actual" : "Seleccionar"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Método de pago */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Método de pago</span>
          </CardTitle>
          <CardDescription>Tarjeta registrada para los pagos automáticos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Número de tarjeta</Label>
              <Input disabled value="**** **** **** 1234" className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label>Fecha de caducidad</Label>
              <Input disabled value="12/26" className="bg-muted/50" />
            </div>
          </div>

          <Button variant="outline" className="rounded-xl">
            <CreditCard className="h-4 w-4 mr-2" />
            Añadir nuevo método
          </Button>
        </CardContent>
      </Card>

      {/* Historial de facturas */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Historial de facturas</span>
          </CardTitle>
          <CardDescription>Últimas facturas y pagos realizados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invoiceHistory.map((invoice, index) => (
              <div key={index}>
                <div className="flex items-center justify-between py-3">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{invoice.concept}</p>
                    <p className="text-xs text-muted-foreground">{invoice.date}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-semibold">{invoice.amount}</span>
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                    >
                      Pagado
                    </Badge>
                  </div>
                </div>
                {index < invoiceHistory.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
