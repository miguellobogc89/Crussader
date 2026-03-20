// app/components/slots/SlotsInterestedClientsCard.tsx

"use client";

import { ArrowRight, Users } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { interestedClientsMock } from "./slots.mock";

type SlotsInterestedClientsCardProps = {
  onInvite?: () => void;
};

export function SlotsInterestedClientsCard({
  onInvite,
}: SlotsInterestedClientsCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.06)] space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
          <Users className="h-4 w-4 text-emerald-600" />
        </div>

        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          Clientes interesados
        </h3>
      </div>

      <div className="rounded-xl bg-slate-50 p-4">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tabular-nums text-foreground">
            {interestedClientsMock.totalActive}
          </span>
          <span className="text-sm text-slate-500">
            clientes activos
          </span>
        </div>

        <p className="mt-1 text-xs text-slate-500">
          {interestedClientsMock.description}
        </p>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">Respuesta media</span>
        <span className="font-medium tabular-nums text-foreground">
          {interestedClientsMock.averageResponseTime}
        </span>
      </div>

      <Button
        onClick={onInvite}
        variant="outline"
        className="group h-10 w-full rounded-xl border-slate-200 bg-slate-50 text-foreground hover:bg-slate-100"
      >
        Invitar a clientes
        <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </Button>
    </div>
  );
}