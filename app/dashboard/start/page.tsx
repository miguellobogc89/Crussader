"use client";

import { useMemo, useState } from "react";
import PageShell from "@/app/components/layouts/PageShell";
import { useBootstrapData } from "@/app/providers/bootstrap-store";
import { useSession } from "next-auth/react";
import { OnboardingModal } from "@/app/components/onboarding/OnboardingModal";
import {
  onboardingSteps,
  initialOnboardingState,
  type OnboardingFlowState,
} from "@/app/components/onboarding/steps";

export default function OnboardingPage() {
  const data = useBootstrapData();
  const { data: session } = useSession();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [flowState, setFlowState] = useState<OnboardingFlowState>(
    initialOnboardingState
  );
  const [isSending, setIsSending] = useState(false);

  const currentStep = onboardingSteps[currentStepIndex];
  const totalSteps = onboardingSteps.length;
  const stepIndexForUi = currentStepIndex + 1;

  // ==========================
  // Nombre del usuario
  // ==========================
  const userName = useMemo(() => {
    const d: any = data ?? {};
    const candidate =
      d.me?.name ??
      d.user?.name ??
      d.currentUser?.name ??
      d.me?.email ??
      d.user?.email ??
      d.currentUser?.email ??
      session?.user?.name ??
      session?.user?.email ??
      "";

    let base = (typeof candidate === "string" && candidate.trim()) || "";
    if (base.includes("@")) base = base.split("@")[0];
    base = base.replace(/[_\.]+/g, " ").split(" ")[0].trim();
    if (!base) return "allí";
    return base.charAt(0).toUpperCase() + base.slice(1).toLowerCase();
  }, [data, session]);

  // ==========================
  // Títulos dinámicos por step
  // ==========================
  const title =
    currentStep.getTitle?.({ userName }) ?? `Bienvenido, ${userName}`;

  const subtitle =
    currentStep.getSubtitle?.({ userName }) ??
    "Cuéntanos algo más sobre tu situación para conectar tu cuenta correctamente.";

  const canGoPrev = currentStepIndex > 0;
  const canGoNext = currentStep.canGoNext(flowState) && !isSending;

  // ==========================
  // Botón Anterior
  // ==========================
  function handlePrev() {
    if (!canGoPrev || isSending) return;

    // Caso especial: desde la pantalla final volvemos a join_email
    if (currentStep.id === "access_request_sent") {
      const joinIndex = onboardingSteps.findIndex((s) => s.id === "join_email");
      if (joinIndex !== -1) {
        setCurrentStepIndex(joinIndex);
      }
      return;
    }

    setCurrentStepIndex((i) => Math.max(0, i - 1));
  }

  // ==========================
  // Botón Siguiente / Solicitar acceso
  // ==========================
  async function handleNext() {
    if (!canGoNext) return;

    // Paso donde mandamos los correos
    if (currentStep.id === "join_email") {
      setIsSending(true);
      try {
        const requesterEmail = session?.user?.email ?? "desconocido@correo.com";
        const requesterName = userName;
        const emails = flowState.joinEmails;

        await fetch("/api/onboarding/access-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            emails,
            requesterName,
            requesterEmail,
          }),
        });

        // Saltamos al paso final
        const finalIndex = onboardingSteps.findIndex(
          (s) => s.id === "access_request_sent"
        );
        if (finalIndex !== -1) {
          setCurrentStepIndex(finalIndex);
        }
      } catch (err) {
        console.error("❌ Error enviando solicitud de acceso:", err);
        // Si quieres, aquí podríamos mostrar un toast.
      } finally {
        setIsSending(false);
      }
      return;
    }

    // Steps normales
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((i) => i + 1);
    }
  }

  // ==========================
  // Patch del estado
  // ==========================
  function patchState(patch: Partial<OnboardingFlowState>) {
    setFlowState((prev) => ({ ...prev, ...patch }));
  }

  // ==========================
  // Render
  // ==========================
  return (
    <PageShell title=" " description="">
      <OnboardingModal
        title={title}
        subtitle={subtitle}
        stepIndex={stepIndexForUi}
        totalSteps={totalSteps}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        onPrev={handlePrev}
        onNext={handleNext}
        currentStepId={currentStep.id}
        isBusy={isSending}
      >
        {currentStep.render({ state: flowState, setState: patchState })}
      </OnboardingModal>
    </PageShell>
  );
}
