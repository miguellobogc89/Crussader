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
  brandIconSrc: string;
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
        "h-[130px]",
        className,
      )}
    >
      <CardContent className="h-full p-4">
        <div className="flex h-full flex-col">
          {/* Bloque superior: icono + (título/desc) */}
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-7 w-7 shrink-0">
              <Image
                src={provider.brandIconSrc}
                alt={provider.brandIconAlt}
                width={28}
                height={28}
                className="h-full w-full object-contain"
              />
            </div>

            <div className="min-w-0 flex-1">
              {/* Título (wrap) */}
              <div className="text-sm font-semibold leading-snug break-words line-clamp-2">
                {provider.name}
              </div>

              {/* Descripción (wrap) */}
              <div className="mt-1 text-xs text-muted-foreground leading-snug break-words line-clamp-2">
                {provider.description}
              </div>
            </div>
          </div>

          {/* Chip pegado abajo */}
          <div className="mt-auto flex justify-end pt-2">
            <Badge
              variant={badgeVariant as any}
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-medium",
                !isComingSoon && "bg-emerald-500 text-white border-transparent",
              )}
            >
              {statusLabel}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
