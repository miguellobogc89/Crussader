// app/components/admin/integrations/whatsapp/templates/TemplateDetailsPanel.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";
import { CheckCircle2, Clock, Copy, ExternalLink, XCircle } from "lucide-react";

import type { TemplateCategory, TemplateStatus, TemplateUse, WaTemplate } from "./types";
import { extractVars } from "./utils";

function StatusBadge({ status }: { status: TemplateStatus }) {
  if (status === "approved") {
    return (
      <Badge className="gap-1">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Aprobada
      </Badge>
    );
  }
  if (status === "pending") {
    return (
      <Badge variant="secondary" className="gap-1">
        <Clock className="h-3.5 w-3.5" />
        En revisión
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="gap-1">
      <XCircle className="h-3.5 w-3.5" />
      Rechazada
    </Badge>
  );
}

function CategoryBadge({ category }: { category: TemplateCategory }) {
  const label =
    category === "marketing" ? "Marketing" : category === "utility" ? "Utility" : "Auth";
  return (
    <Badge variant="outline" className="text-xs">
      {label}
    </Badge>
  );
}

function UseBadge({ use }: { use: TemplateUse }) {
  return (
    <Badge variant="outline" className="text-xs">
      {use === "start_conversation" ? "Inicia conversación" : "Solo 24h"}
    </Badge>
  );
}

export default function TemplateDetailsPanel({
  selected,
}: {
  selected: WaTemplate | null;
}) {
  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="border-b py-4">
        <CardTitle className="text-base">Detalle</CardTitle>
        <CardDescription>Selecciona una plantilla para ver el contenido.</CardDescription>
      </CardHeader>

      <CardContent className="h-[calc(100%-92px)] overflow-auto p-0">
        {!selected ? (
          <div className="p-6 text-sm text-muted-foreground">No hay selección.</div>
        ) : (
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold">{selected.title}</div>
                <div className="mt-1 font-mono text-xs text-muted-foreground">{selected.name}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard?.writeText(selected.name);
                  }}
                  aria-label="Copiar nombre"
                >
                  <Copy className="h-4 w-4" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Abrir en Meta"
                  disabled
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatusBadge status={selected.status} />
              <CategoryBadge category={selected.category} />
              <Badge variant="outline" className="text-xs">
                {selected.language}
              </Badge>
              <UseBadge use={selected.use} />
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground">Preview</div>
              <div className="rounded-lg border bg-muted/20 p-4 text-sm leading-relaxed">
                {selected.body}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground">Variables</div>
              <div className="flex flex-wrap gap-2">
                {extractVars(selected.body).length === 0 ? (
                  <div className="text-sm text-muted-foreground">Sin variables.</div>
                ) : (
                  extractVars(selected.body).map((v) => (
                    <Badge key={v} variant="secondary">
                      {v}
                    </Badge>
                  ))
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground">Acciones (mock)</div>

              <div className="grid gap-2 sm:grid-cols-2">
                <Button variant="outline" disabled>
                  Probar envío (template)
                </Button>
                <Button variant="outline" disabled>
                  Asignar a Quick Action
                </Button>
                <Button variant="outline" disabled>
                  Duplicar como variante
                </Button>
                <Button variant="destructive" disabled>
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}