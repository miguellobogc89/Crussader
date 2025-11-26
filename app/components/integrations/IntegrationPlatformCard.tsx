// app/components/integrations/IntegrationPlatformCard.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { cn } from "@/lib/utils";

export type Provider = {
  key: string;
  name: string;
  description: string;
  brandIconSrc: string; // ruta del icono (png/svg en /public)
  brandIconAlt: string;
  comingSoon?: boolean;
};

type Props = {
  provider: Provider;
  className?: string;
};

export default function IntegrationPlatformCard({ provider, className }: Props) {
  const isComingSoon = provider.comingSoon === true;
  const statusLabel = isComingSoon ? "Próximamente" : "Disponible";
  const badgeVariant = isComingSoon ? "outline" : "default";

  return (
    <Card
      className={cn(
        "border transition-all hover:shadow-sm",
        // altura bajita
        "h-[110px]",
        className,
      )}
    >
      <CardContent className="flex h-full items-center justify-between gap-3 p-4">
        {/* Izquierda: icono + textos */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {/* Icono plataforma */}
          <div className="h-7 w-7 shrink-0">
            <Image
              src={provider.brandIconSrc}
              alt={provider.brandIconAlt}
              width={28}
              height={28}
              className="h-full w-full object-contain"
            />
          </div>

          {/* Nombre + descripción */}
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold leading-tight">
              {provider.name}
            </div>
            <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {provider.description}
            </div>
          </div>
        </div>

        {/* Derecha: chip de estado */}
        <Badge
          variant={badgeVariant as any}
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
            !isComingSoon && "bg-emerald-500 text-white border-transparent",
          )}
        >
          {statusLabel}
        </Badge>
      </CardContent>
    </Card>
  );
}
