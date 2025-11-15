"use client";

import { cn } from "@/lib/utils";
import type { OnboardingStepProps } from "./index";

export function ChoiceStep({ state, setState }: OnboardingStepProps) {
  const selected = state.selectedOption;

  return (
    <div className="space-y-4">
      {/* Opción: unirse a empresa */}
      <button
        type="button"
        onClick={() => setState({ selectedOption: "join" })}
        className={cn(
          "w-full text-left rounded-xl border px-4 py-4 shadow-sm transition",
          "border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-slate-100",
          selected === "join" &&
            "border-indigo-500 shadow-[0_0_0_3px_rgba(99,102,241,0.35)]"
        )}
      >
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <span
            className={cn(
              "mt-1 flex h-5 w-5 items-center justify-center rounded-md border transition",
              "border-slate-300 bg-white",
              selected === "join" && "border-indigo-500 bg-indigo-500"
            )}
          >
            {selected === "join" && (
              <svg
                className="h-3 w-3 text-white"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="3"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </span>

          <div>
            <div className="font-semibold text-slate-900">
              Mi empresa ya existe en Crussader y quiero unirme
            </div>
            <div className="mt-1 text-sm text-slate-600">
              Enviaremos una solicitud al administrador de tu empresa para que
              te invite.
            </div>
          </div>
        </div>
      </button>

      {/* Opción: crear empresa (flujo que trabajaremos luego) */}
      <button
        type="button"
        onClick={() => setState({ selectedOption: "create" })}
        className={cn(
          "w-full text-left rounded-xl border px-4 py-4 shadow-sm transition",
          "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50",
          selected === "create" &&
            "border-indigo-500 shadow-[0_0_0_3px_rgba(99,102,241,0.35)]"
        )}
      >
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "mt-1 flex h-5 w-5 items-center justify-center rounded-md border transition",
              "border-slate-300 bg-white",
              selected === "create" && "border-indigo-500 bg-indigo-500"
            )}
          >
            {selected === "create" && (
              <svg
                className="h-3 w-3 text-white"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="3"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </span>

          <div>
            <div className="font-semibold text-slate-900">
              Quiero dar de alta mi empresa en Crussader
            </div>
            <div className="mt-1 text-sm text-slate-600">
              Serás el administrador principal y podrás invitar a otros usuarios después.
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}
