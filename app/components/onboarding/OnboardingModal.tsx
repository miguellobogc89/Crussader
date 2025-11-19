// app/components/onboarding/OnboardingModal.tsx
"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type OnboardingModalProps = {
  title: string;
  subtitle?: string;
  stepIndex: number;
  totalSteps: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void | Promise<void>;
  children: ReactNode;
  currentStepId: string;
  isBusy?: boolean;
};

export function OnboardingModal({
  title,
  subtitle,
  stepIndex,
  totalSteps,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  children,
  currentStepId,
  isBusy = false,
}: OnboardingModalProps) {
  // 👉 Detectar si estamos en el paso FINAL
  const isFinished = currentStepId === "finished";

  // 👉 Botón anterior solo si NO estamos en el final
  const effectiveCanPrev = canGoPrev && !isBusy && !isFinished;

  // 👉 Botón siguiente siempre visible, pero renombrado a "Finalizar" en el último paso
  const effectiveCanNext = canGoNext && !isBusy;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-xl rounded-2xl shadow-2xl bg-white overflow-hidden border border-slate-200 animate-in fade-in duration-150">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-6 py-5 text-white">
          <h2 className="text-xl font-semibold">{title}</h2>
          {subtitle && (
            <p className="text-white/80 text-sm mt-1 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* BODY */}
        <div className="px-6 py-6">{children}</div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
          {/* ===== BOTÓN ANTERIOR ===== */}
          {!isFinished ? (
            <button
              type="button"
              disabled={!effectiveCanPrev}
              onClick={effectiveCanPrev ? onPrev : undefined}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition",
                !effectiveCanPrev
                  ? "text-slate-400 cursor-not-allowed"
                  : "text-indigo-600 hover:text-indigo-700"
              )}
            >
              Anterior
            </button>
          ) : (
            <div /> // placeholder para mantener espaciado
          )}

          {/* ===== BOTÓN SIGUIENTE / FINALIZAR ===== */}
          <button
            type="button"
            disabled={!effectiveCanNext}
            onClick={effectiveCanNext ? onNext : undefined}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-semibold text-white shadow-md transition",
              "bg-gradient-to-r from-indigo-600 to-fuchsia-600",
              "hover:opacity-90 hover:shadow-lg",
              (!effectiveCanNext || isBusy) &&
                "opacity-40 cursor-not-allowed hover:opacity-40 hover:shadow-none"
            )}
          >
            {isBusy
              ? "Procesando…"
              : currentStepId === "join_email"
              ? "Solicitar acceso"
              : currentStepId === "create_company"
              ? "Crear"
              : isFinished
              ? "Finalizar"
              : "Siguiente"}
          </button>
        </div>

        {/* ===== INDICADOR DE PROGRESO ===== */}
        {!isFinished && (
          <div className="py-3 text-center text-xs text-slate-500 bg-white/60 border-t border-slate-100">
            Paso {stepIndex} de {totalSteps}
          </div>
        )}
      </div>
    </div>
  );
}
