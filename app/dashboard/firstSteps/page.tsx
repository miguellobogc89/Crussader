"use client";

import {
  CheckCircle2,
  PlayCircle,
  Building2,
  Paintbrush,
  Landmark,
  CreditCard,
  Users,
  Hexagon,
  Sparkles,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Progress } from "@/app/components/ui/progress";
import { Badge } from "@/app/components/ui/badge";
import { cn } from "@/lib/utils"; // si no tienes `cn`, reemplaza por `${cond ? 'a' : ''} ...`

type Step = {
  id: number;
  title: string;
  description: string;
  action?: string;
  done?: boolean;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

// ——— Mock de pasos (puedes reordenar/ajustar textos más tarde)
const steps: Step[] = [
  { id: 1, title: "Crear cuenta", description: "Tu espacio de trabajo ya está listo.", done: true, icon: CheckCircle2 },
  { id: 2, title: "Guía rápida de Crussader", description: "Conoce lo esencial en 5 minutos.", action: "Ver vídeo", icon: PlayCircle },
  { id: 3, title: "Datos de tu negocio", description: "Información fiscal y de facturación.", action: "Completar", icon: Building2 },
  { id: 4, title: "Identidad de marca", description: "Logotipo, colores y plantilla de factura.", done: true, icon: Paintbrush },
  { id: 5, title: "Conecta tus bancos", description: "Conciliación y tesorería al día.", action: "Añadir cuenta", icon: Landmark },
  { id: 6, title: "Métodos de cobro", description: "Transferencia o pasarela de pago.", action: "Configurar", icon: CreditCard },
  { id: 7, title: "Invita a tu equipo", description: "Permisos y roles por perfil.", action: "Invitar", icon: Users },
];

export default function FirstStepsPage() {
  const completed = steps.filter((s) => s.done).length;
  const progress = Math.round((completed / steps.length) * 100);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground">
            <Hexagon className="h-3.5 w-3.5" />
            <span>Primeros pasos</span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Despega con Crussader</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Completa estas tareas para dejar tu cuenta lista. Puedes hacerlo en minutos y volver cuando quieras.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">Saltar por ahora</Button>
          <Button size="sm" className="gap-1">
            <Sparkles className="h-4 w-4" />
            Guía interactiva
          </Button>
        </div>
      </div>

      {/* Progress */}
      <Card className="mb-8 border-dashed bg-gradient-to-br from-muted/40 via-background to-background">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span>Progreso general</span>
            <span className="text-sm font-normal text-muted-foreground">
              {completed} de {steps.length} completados
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <Progress value={progress} className="h-2" />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {steps.map((s) => (
              <div
                key={s.id}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs",
                  s.done ? "border-emerald-300/50 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "text-muted-foreground"
                )}
              >
                {s.title}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, idx) => (
          <StepRow key={step.id} step={step} isCurrent={!step.done && steps.slice(0, idx).every((s) => s.done)} />
        ))}
      </div>
    </div>
  );
}

/* ——— Subcomponente visual para cada fila ——— */
function StepRow({ step, isCurrent }: { step: Step; isCurrent: boolean }) {
  const Icon = step.icon;

  return (
    <Card
      className={cn(
        "group border bg-card/70 transition-colors",
        isCurrent && "border-primary/30"
      )}
    >
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div className="flex min-w-0 items-start gap-4">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl border",
              step.done
                ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                : "border-muted-foreground/20 bg-muted/40 text-muted-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="mb-0.5 flex items-center gap-2">
              <h3
                className={cn(
                  "truncate text-base font-medium",
                  step.done && "text-muted-foreground line-through"
                )}
              >
                {step.title}
              </h3>

              {step.done ? (
                <Badge
                  variant="outline"
                  className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                >
                  Completado
                </Badge>
              ) : isCurrent ? (
                <Badge variant="secondary">Siguiente</Badge>
              ) : (
                <Badge variant="outline">Pendiente</Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground">{step.description}</p>
          </div>
        </div>

        {/* CTA / Check */}
        {step.done ? (
          <CheckCircle2 className="h-6 w-6 text-emerald-500" />
        ) : step.action ? (
          <Button variant={isCurrent ? "default" : "secondary"} size="sm" className="whitespace-nowrap">
            {step.action}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
