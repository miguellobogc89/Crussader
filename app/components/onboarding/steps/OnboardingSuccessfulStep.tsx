"use client";

import * as React from "react";
import { Button } from "@/app/components/ui/button";

export function OnboardingSuccessfulStep() {
  async function finish() {
    try {
      // Marca al usuario como onboarding completado
      await fetch("/api/onboarding/complete", {
        method: "POST",
      });
    } catch (e) {
      console.error("Error setting onboarding completed", e);
    }

    // Redirección final
    window.location.href = "/dashboard/slots";
  }

  return (
    <div className="space-y-6 text-center text-slate-700">
      <p className="text-base font-semibold">¡Todo listo! 🎉</p>

      <p className="text-sm text-slate-500">
        Tu empresa y tu primer establecimiento han sido creados correctamente.
        Ya puedes empezar a trabajar con Crussader.
      </p>

      <div className="pt-4">
        <Button
          onClick={finish}
          className="px-6 py-2.5 rounded-full text-sm font-semibold"
        >
          Finalizar
        </Button>
      </div>
    </div>
  );
}
