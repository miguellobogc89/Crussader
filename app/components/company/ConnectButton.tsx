// app/components/company/ConnectButton.tsx
"use client";

import { Button } from "@/app/components/ui/button";

type Props = {
  canConnect: boolean;
  onConnect: () => void;
  onViewPlans: () => void;
};

export function ConnectButton({ canConnect, onConnect, onViewPlans }: Props) {
  if (canConnect) {
    return (
      <Button
        onClick={onConnect}
        className="px-2 py-1 text-sm bg-primary text-white hover:bg-primary/90"
      >
        Conectar con Google
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-start md:items-end">
      <Button
        variant="outline"
        onClick={onViewPlans}
        className="px-2 py-1 text-sm"
      >
        Ver planes
      </Button>
      <p className="text-xs text-muted-foreground mt-1 text-left md:text-right max-w-[180px]">
        Todavía no tienes una suscripción activa o tu plan no permite más ubicaciones.
      </p>
    </div>
  );
}
