// app/components/sidebar/BetaPlanCard.tsx
"use client";

import { FlaskConical, Sparkles } from "lucide-react";

type Props = {
  collapsed?: boolean;
  variant?: "beta" | "plan";
  planLabel?: string;
};

export function BetaPlanCard({
  collapsed = false,
  variant = "beta",
  planLabel,
}: Props) {
  if (collapsed) {
    return (
      <div className="px-2 pb-2">
        <div className="flex items-center justify-center rounded-xl border border-orange-400/70 bg-slate-900/60 p-1.5 shadow-[0_0_8px_rgba(251,146,60,0.35)] xl2:p-2">
          {variant === "beta" ? (
            <FlaskConical className="h-3.5 w-3.5 text-slate-200 xl2:h-4 xl2:w-4" />
          ) : (
            <Sparkles className="h-3.5 w-3.5 text-slate-200 xl2:h-4 xl2:w-4" />
          )}
        </div>
      </div>
    );
  }

  const isBeta = variant === "beta";
  const title = isBeta ? "Fase de prueba" : "Plan actual";
  const badge = isBeta ? "BETA" : (planLabel ?? "PLAN");
  const desc = isBeta
    ? "Algunas funciones pueden ajustarse mientras lo mejoramos."
    : "Detalles de tu suscripción y límites del plan.";

  return (
    <div className="px-2 pb-2">
      <div
        className={[
          "relative overflow-hidden rounded-2xl",
          "border border-orange-400/80",
          "bg-gradient-to-b from-slate-900/80 to-slate-950/80",
          "p-2.5 xl2:p-3",
          "shadow-[0_0_0_1px_rgba(251,146,60,0.35),0_0_20px_rgba(251,146,60,0.15)]",
        ].join(" ")}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-orange-400/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-orange-500/10 blur-2xl" />

        <div className="flex items-start gap-2.5 xl2:gap-3">
          <div
            className={[
              "flex items-center justify-center rounded-xl",
              "h-8 w-8 xl2:h-9 xl2:w-9",
              "border border-slate-800 bg-slate-900/60",
            ].join(" ")}
          >
            {isBeta ? (
              <FlaskConical className="h-3.5 w-3.5 text-slate-200 xl2:h-4 xl2:w-4" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 text-slate-200 xl2:h-4 xl2:w-4" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[12px] font-semibold text-slate-100 xl2:text-[13px]">
                {title}
              </p>

              <span
                className={[
                  "shrink-0 rounded-full border border-slate-700/80 bg-slate-900/70",
                  "px-1.5 py-0.5 xl2:px-2",
                  "text-[9px] font-medium tracking-wide xl2:text-[10px]",
                  isBeta ? "text-orange-300" : "text-slate-200",
                ].join(" ")}
              >
                {badge}
              </span>
            </div>

            <p className="mt-1 hidden text-[12px] leading-snug text-slate-300/90 xl2:block">
              {desc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}