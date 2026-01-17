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
        <div className="rounded-xl border border-orange-400/70 bg-slate-900/60 p-2 flex items-center justify-center shadow-[0_0_8px_rgba(251,146,60,0.35)]">
          {variant === "beta" ? (
            <FlaskConical className="h-4 w-4 text-slate-200" />
          ) : (
            <Sparkles className="h-4 w-4 text-slate-200" />
          )}
        </div>
      </div>
    );
  }

  const isBeta = variant === "beta";
  const title = isBeta ? "Fase beta" : "Plan actual";
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
          "p-3",
          "shadow-[0_0_0_1px_rgba(251,146,60,0.35),0_0_20px_rgba(251,146,60,0.15)]",
        ].join(" ")}
      >
        {/* glow naranja sutil */}
        <div className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-orange-400/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-orange-500/10 blur-2xl" />

        <div className="flex items-start gap-3">
          {/* ICONO: borde restaurado */}
          <div
            className={[
              "h-9 w-9 rounded-xl flex items-center justify-center",
              "border border-slate-800 bg-slate-900/60",
            ].join(" ")}
          >
            {isBeta ? (
              <FlaskConical className="h-4 w-4 text-slate-200" />
            ) : (
              <Sparkles className="h-4 w-4 text-slate-200" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[13px] font-semibold text-slate-100">
                {title}
              </p>

              {/* CHIP BETA refinado */}
              <span
                className={[
                  "shrink-0 rounded-full px-2 py-0.5",
                  "text-[10px] font-medium tracking-wide",
                  "border border-slate-700/80",
                  "bg-slate-900/70",
                  isBeta ? "text-orange-300" : "text-slate-200",
                ].join(" ")}
              >
                {badge}
              </span>
            </div>

            <p className="mt-1 text-[12px] leading-snug text-slate-300/90">
              {desc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
