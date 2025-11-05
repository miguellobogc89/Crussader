"use client";

import * as React from "react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Loader2 } from "lucide-react";

export type Status = "connected" | "pending" | "disconnected" | "coming-soon";

export type Provider = {
  key: string;
  name: string;
  status: Status;
  brandIcon: React.ReactNode; // normalmente <Image> envuelto a 28x28
  description?: string;
  clickable?: boolean;        // opcional
};

function SoonBadge() {
  return (
    <Badge variant="secondary" className="rounded-full border border-dashed">
      Próximamente
    </Badge>
  );
}

function StatusBadge({ status }: { status: Status }) {
  if (status === "connected") return <Badge className="rounded-full bg-emerald-600 hover:bg-emerald-600">Conectado</Badge>;
  if (status === "pending") return <Badge className="rounded-full bg-amber-500 hover:bg-amber-500">Pendiente</Badge>;
  if (status === "disconnected") return <Badge variant="outline" className="rounded-full">Sin conexión</Badge>;
  return <SoonBadge />;
}

type Props = {
  provider: Provider;
  /**
   * Callback de conexión. Si no se pasa, el botón no hará nada (o irá disabled si es "coming-soon").
   */
  onConnect?: (providerKey: string) => void | Promise<void>;
};

export default function IntegrationPlatformCard({ provider, onConnect }: Props) {
  const [busy, setBusy] = React.useState(false);

  const disabled =
    provider.status === "coming-soon" ||
    (provider.status === "connected" && !onConnect); // nada que hacer si ya está conectada

  async function handleConnect() {
    if (!onConnect || disabled) return;
    try {
      setBusy(true);
      await onConnect(provider.key);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="group relative overflow-hidden">
      <CardContent className="p-5">
        {/* Header: icono + nombre + estado */}
        <div className="flex items-center gap-3">
          <div className="shrink-0">{provider.brandIcon}</div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{provider.name}</h3>
              <StatusBadge status={provider.status} />
            </div>
            {provider.description ? (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {provider.description}
              </p>
            ) : null}
          </div>
        </div>

        {/* Footer: botón a la derecha, estilo discreto */}
        <div className="mt-4 flex items-center">
          <div className="ml-auto">
            <Button
              onClick={handleConnect}
              disabled={disabled || busy}
              // estilo más elegante/discreto: outline suave + fondo leve al hover
              variant="outline"
              className="border-muted-foreground/20 text-foreground hover:bg-muted"
            >
              {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Conectando…</> : "Conectar"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
