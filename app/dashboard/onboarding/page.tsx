"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import PageShell from "@/app/components/layouts/PageShell";
import { useBootstrapData } from "@/app/providers/bootstrap-store";
import { useSession } from "next-auth/react";
import { OnboardingModal } from "@/app/components/onboarding/OnboardingModal";
import {
  onboardingSteps,
  initialOnboardingState,
  type OnboardingFlowState,
  type StepId,
} from "@/app/components/onboarding/steps";

// ==========================
// Helpers de indexación visual
// ==========================

function resolveStepNumberForUi(
  stepId: StepId,
  state: OnboardingFlowState,
): number {
  // Ruta JOIN: choice → join_email → access_request_sent
  if (state.selectedOption === "join") {
    if (stepId === "choice") return 1;
    if (stepId === "join_email") return 2;
    if (stepId === "access_request_sent") return 3;
    return 1;
  }

  // Ruta CREATE:
  // choice → create_company → finished
  if (state.selectedOption === "create") {
    if (stepId === "choice") return 1;
    if (stepId === "create_company") return 2;
    // cualquier otro paso de la ruta create lo tratamos como el último (finished)
    return 3;
  }

  // Antes de elegir ruta: solo choice
  return 1;
}

function resolveTotalStepsForUi(state: OnboardingFlowState): number {
  if (state.selectedOption === "join") return 3;
  if (state.selectedOption === "create") return 3; // choice, create_company, finished
  return 1;
}

// ==========================
// Helper para sync URL (?stepId=.)
// ==========================

function updateStepInUrl(stepId: StepId) {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  url.searchParams.set("stepId", stepId);
  window.history.replaceState({}, "", url.toString());
}

export default function OnboardingPage() {
  const data = useBootstrapData();
  const { data: session } = useSession();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [flowState, setFlowState] = useState<OnboardingFlowState>(
    initialOnboardingState,
  );
  const [isSending, setIsSending] = useState(false);

  const searchParams = useSearchParams();

  // Lee stepId de la URL y ajusta selectedOption
  useEffect(() => {
    if (!searchParams) return;

    const stepIdParam = searchParams.get("stepId") as StepId | null;

    if (stepIdParam) {
      const idx = onboardingSteps.findIndex((s) => s.id === stepIdParam);
      if (idx !== -1) {
        setCurrentStepIndex(idx);

        setFlowState((prev) => {
          let selectedOption = prev.selectedOption;

          if (
            stepIdParam === "join_email" ||
            stepIdParam === "access_request_sent"
          ) {
            selectedOption = "join";
          } else if (
            stepIdParam === "create_company" ||
            stepIdParam === "finished"
          ) {
            selectedOption = "create";
          }

          return {
            ...prev,
            selectedOption,
          };
        });
      }
    }
  }, [searchParams]);

  const currentStep = onboardingSteps[currentStepIndex];

  const totalSteps = resolveTotalStepsForUi(flowState);
  const stepIndexForUi = resolveStepNumberForUi(currentStep.id, flowState);

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

    if (currentStep.id === "access_request_sent") {
      const joinIndex = onboardingSteps.findIndex(
        (s) => s.id === "join_email",
      );
      if (joinIndex !== -1) {
        setCurrentStepIndex(joinIndex);
        updateStepInUrl("join_email");
      }
      return;
    }

    const newIndex = Math.max(0, currentStepIndex - 1);
    const newStepId = onboardingSteps[newIndex].id as StepId;
    setCurrentStepIndex(newIndex);
    updateStepInUrl(newStepId);
  }

  // ==========================
  // Botón Siguiente / lógica por paso
  // ==========================
  async function handleNext() {
    if (!canGoNext) return;

    // ---- Paso "choice": saltar al flujo correspondiente
    if (currentStep.id === "choice") {
      if (flowState.selectedOption === "join") {
        const joinIndex = onboardingSteps.findIndex(
          (s) => s.id === "join_email",
        );
        if (joinIndex !== -1) {
          setCurrentStepIndex(joinIndex);
          updateStepInUrl("join_email");
          return;
        }
      }

      if (flowState.selectedOption === "create") {
        const createIndex = onboardingSteps.findIndex(
          (s) => s.id === "create_company",
        );
        if (createIndex !== -1) {
          setCurrentStepIndex(createIndex);
          updateStepInUrl("create_company");
          return;
        }
      }

      return;
    }

    // ---- Paso "join_email"
    if (currentStep.id === "join_email") {
      setIsSending(true);
      try {
        const requesterEmail =
          session?.user?.email ?? "desconocido@correo.com";
        const requesterName = userName;
        const emails = flowState.joinEmails;

        const res = await fetch("/api/onboarding/access-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            emails,
            requesterName,
            requesterEmail,
          }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok || !data?.ok) {
          console.error(
            "❌ Error enviando solicitud de acceso:",
            res.status,
            data,
          );
          setIsSending(false);
          return;
        }

        const finalIndex = onboardingSteps.findIndex(
          (s) => s.id === "access_request_sent",
        );
        if (finalIndex !== -1) {
          setCurrentStepIndex(finalIndex);
          updateStepInUrl("access_request_sent");
        }
      } catch (err) {
        console.error("❌ Error enviando solicitud de acceso:", err);
      } finally {
        setIsSending(false);
      }
      return;
    }

// ---- Paso "create_company": crear empresa + establecimiento y saltar a finished
if (currentStep.id === "create_company") {
  setIsSending(true);
  try {
    // 1) Crear empresa si aún no tenemos companyId
    let companyId = flowState.companyId;
    const c = flowState.companyForm;

    if (!companyId) {
      const name = c.name.trim();

      const res = await fetch("/api/mybusiness/company/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: c.email,
          phone: c.phone,
          address: c.address,
          employeesBand: c.employeesBand,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        console.error("❌ Error creando empresa:", res.status, data);
        setIsSending(false);
        return;
      }

      const companyFromApi = data.company;
      const companyIdFromApi = data.companyId ?? data.company?.id ?? null;

      if (!companyIdFromApi) {
        console.error("❌ Respuesta sin companyId al crear empresa:", data);
        setIsSending(false);
        return;
      }

      const finalName = companyFromApi?.name ?? name;

      companyId = companyIdFromApi;

      setFlowState((prev) => ({
        ...prev,
        companyId: companyIdFromApi,
        companyForm: {
          ...prev.companyForm,
          name: finalName,
        },
      }));
    }

    // 2) Crear Location (establecimiento) **ligada a esa company**
    const {
      title,
      address,
      city,
      postalCode,
      phone,
      website,
      activityId,
      typeId,
    } = flowState.locationForm;

    const locRes = await fetch("/api/mybusiness/locations/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId,     // 👈 IMPORTANTE: ligar la location a la empresa creada
        title,
        address,
        city,
        postalCode,
        phone,
        website,
        activityId,
        typeId,
      }),
    });

    const locData = await locRes.json().catch(() => null);

    console.log(
      "[Onboarding] locations/create response",
      locRes.status,
      locData,
    );

    if (!locRes.ok || !locData?.ok) {
      console.error("❌ Error creando Location:", locRes.status, locData);
      setIsSending(false);
      return;
    }

    setFlowState((prev) => ({
      ...prev,
      locationCreated: true,
    }));

    // 3) Ir al paso final "finished"
    const nextId = "finished" as StepId;
    const idx = onboardingSteps.findIndex((s) => s.id === nextId);
    if (idx !== -1) {
      setCurrentStepIndex(idx);
      updateStepInUrl(nextId);
    } else if (typeof window !== "undefined") {
      window.location.href = "/dashboard/mybusiness";
    }
  } catch (err) {
    console.error("❌ Error creando empresa + location:", err);
  } finally {
    setIsSending(false);
  }
  return;
}


    // ---- Paso "finished": ir al dashboard (fallback si el propio step no lo hace)
    if (currentStep.id === "finished") {
      if (typeof window !== "undefined") {
        window.location.href = "/dashboard/mybusiness";
      }
      return;
    }

    // ---- Fallback para otros steps
    if (currentStepIndex < onboardingSteps.length - 1) {
      const newIndex = currentStepIndex + 1;
      const newStepId = onboardingSteps[newIndex].id as StepId;
      setCurrentStepIndex(newIndex);
      updateStepInUrl(newStepId);
    }
  }

  function patchState(patch: Partial<OnboardingFlowState>) {
    setFlowState((prev) => ({ ...prev, ...patch }));
  }

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
