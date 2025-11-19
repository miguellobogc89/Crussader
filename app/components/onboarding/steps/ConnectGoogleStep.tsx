// app/components/steps/ConnectGoogleStep.tsx
"use client";

import * as React from "react";
import type { OnboardingStepProps } from "@/app/components/onboarding/steps";
import { Button } from "@/app/components/ui/button";

export function ConnectGoogleStep({ state, setState }: OnboardingStepProps) {
  const [checking, setChecking] = React.useState(true);
  const [connected, setConnected] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function checkStatus() {
      setChecking(true);
      try {
        // Usamos el endpoint genérico de integraciones
        const res = await fetch(
          "/api/integrations?provider=google-business",
          { credentials: "include" },
        );

        if (!res.ok) {
          if (!cancelled) {
            setConnected(false);
          }
          return;
        }

        const data: any = await res.json().catch(() => null);

        const connections = Array.isArray(data?.connections)
          ? data.connections
          : [];

        const hasGoogleBusiness = connections.some((conn: any) => {
          const p = (conn?.provider ?? "").toString().toLowerCase();
          return (
            p === "google-business" ||
            (p.includes("google") && p.includes("business"))
          );
        });

        if (!cancelled) {
          setConnected(hasGoogleBusiness);
        }
      } catch {
        if (!cancelled) {
          setConnected(false);
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    }

    checkStatus();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleConnectClick() {
    const params = new URLSearchParams();

    // Volver exactamente a este step al terminar OAuth
    params.set("returnTo", "/dashboard/onboarding?stepId=connect_google");

    window.location.href =
      "/api/integrations/google/business-profile/connect?" +
      params.toString();
  }

  return (
    <div className="space-y-6 text-slate-700">
      <p className="text-sm leading-relaxed">
        Ahora puedes conectar tu cuenta de{" "}
        <span className="font-semibold">Google Business Profile</span>. Es la
        ficha que aparece cuando tus clientes buscan tu negocio en Google o en
        Google Maps, y donde dejan sus reseñas.
      </p>

      <p className="text-sm leading-relaxed">
        <span className="font-semibold">
          Debes conectar la cuenta de tu negocio de Google y marcar todas las
          casillas
        </span>
        , así Crussader podrá leer tus reseñas de Google de forma segura y
        ayudarte a responderlas de manera automática y organizada, sin que
        tengas que entrar cada vez en Google.
      </p>

      <div className="flex justify-center pt-2">
        {checking && (
          <Button
            type="button"
            disabled
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full shadow-md border border-slate-200 bg-white text-sm font-semibold text-slate-800"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-sm bg-white">
              <img
                src="/platform-icons/google-business.png"
                alt="Google Business"
                className="h-5 w-5"
              />
            </span>
            <span>Comprobando conexión…</span>
          </Button>
        )}

        {!checking && connected === true && (
          <Button
            type="button"
            onClick={handleConnectClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full shadow-md border border-emerald-200 bg-emerald-50 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-sm bg-white">
              <img
                src="/platform-icons/google-business.png"
                alt="Google Business"
                className="h-5 w-5"
              />
            </span>
            <span>Cuenta de Google conectada</span>
          </Button>
        )}

        {!checking && connected === false && (
          <Button
            type="button"
            onClick={handleConnectClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full shadow-md border border-slate-200 bg-white text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-sm bg-white">
              <img
                src="/platform-icons/google-business.png"
                alt="Google Business"
                className="h-5 w-5"
              />
            </span>
            <span>Conectar con Google</span>
          </Button>
        )}
      </div>

      <p className="text-xs text-center text-slate-500">
        Si lo prefieres, puedes conectar tu cuenta más adelante desde el
        apartado <span className="font-medium">Integraciones</span>.
      </p>
    </div>
  );
}
