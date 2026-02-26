// app/dashboard/admin/whatsapp/settings/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";
import { ArrowRight, Info } from "lucide-react";

declare global {
  interface Window {
    FB?: {
      init: (opts: {
        appId: string;
        cookie: boolean;
        xfbml: boolean;
        version: string;
      }) => void;
      login: (
        cb: (resp: { status?: string; authResponse?: { accessToken?: string } }) => void,
        opts: { config_id: string; response_type?: string; override_default_response_type?: boolean }
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

function loadFacebookSdk(appId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("SDK only runs in browser"));
      return;
    }

    if (window.FB) {
      resolve();
      return;
    }

    const existing = document.getElementById("facebook-jssdk");
    if (existing) {
      // si ya está inyectado, esperamos a fbAsyncInit
      const check = window.setInterval(() => {
        if (window.FB) {
          window.clearInterval(check);
          resolve();
        }
      }, 50);
      return;
    }

    window.fbAsyncInit = function () {
      if (!window.FB) {
        reject(new Error("FB SDK init failed"));
        return;
      }

      window.FB.init({
        appId,
        cookie: true,
        xfbml: false,
        version: "v20.0",
      });

      resolve();
    };

    const js = document.createElement("script");
    js.id = "facebook-jssdk";
    js.async = true;
    js.defer = true;
    js.src = "https://connect.facebook.net/en_US/sdk.js";

    js.onerror = function () {
      reject(new Error("Failed to load Facebook SDK script"));
    };

    document.body.appendChild(js);
  });
}

export default function WhatsAppSettingsPage() {
  const [sdkReady, setSdkReady] = useState(false);
  const [busy, setBusy] = useState(false);

  const appId = useMemo(() => process.env.NEXT_PUBLIC_META_APP_ID ?? "", []);
  const configId = useMemo(
    () => process.env.NEXT_PUBLIC_WA_EMBEDDED_SIGNUP_CONFIG_ID ?? "",
    []
  );

  useEffect(() => {
    if (!appId) {
      return;
    }

    loadFacebookSdk(appId)
      .then(() => setSdkReady(true))
      .catch(() => setSdkReady(false));
  }, [appId]);

async function handleConnect() {
  if (!appId || !configId) {
    alert("Faltan env vars: NEXT_PUBLIC_META_APP_ID o NEXT_PUBLIC_WA_EMBEDDED_SIGNUP_CONFIG_ID");
    return;
  }

  setBusy(true);

  try {
    await loadFacebookSdk(appId);

    // Debug útil
    // eslint-disable-next-line no-console
    console.log("[WA] appId:", appId, "configId:", configId, "origin:", window.location.origin);
    // eslint-disable-next-line no-console
    console.log("[WA] FB exists?", Boolean(window.FB));

    if (!window.FB) {
      setBusy(false);
      alert("Facebook SDK no está disponible (window.FB es undefined)");
      return;
    }

    window.FB.login(
      (resp) => {
        // eslint-disable-next-line no-console
        console.log("[WA] FB.login callback resp:", resp);
        setBusy(false);
      },
      {
        config_id: configId,
        response_type: "code",
        override_default_response_type: true,
      }
    );
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[WA] handleConnect error:", e);
    setBusy(false);
    alert("No se pudo iniciar el flujo de Meta. Mira consola (error real logueado).");
  }
}

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="space-y-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">Dar de alta número</CardTitle>
              <CardDescription>
                Conecta un número de WhatsApp Business a Crussader usando el onboarding oficial de Meta.
              </CardDescription>
            </div>

            <Badge variant="secondary" className="shrink-0">
              Sin configurar
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-lg border p-3 text-sm flex gap-2">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-medium">Qué hará el asistente</p>
              <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                <li>El cliente inicia sesión en Meta</li>
                <li>Selecciona o crea su Business Manager</li>
                <li>Añade su número y lo verifica por SMS</li>
                <li>Crussader guarda el vínculo (WABA / Phone Number ID)</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              {sdkReady ? "SDK de Meta listo." : "SDK de Meta no cargado (revisa APP ID / dominio)."}
            </div>

            <Button
              type="button"
              className="gap-2"
              onClick={handleConnect}
              disabled={!sdkReady || busy}
            >
              Conectar número
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg border p-3">
              <div className="text-muted-foreground">WABA ID</div>
              <div className="font-medium mt-1">—</div>
            </div>

            <div className="rounded-lg border p-3">
              <div className="text-muted-foreground">Phone Number ID</div>
              <div className="font-medium mt-1">—</div>
            </div>

            <div className="rounded-lg border p-3">
              <div className="text-muted-foreground">Estado</div>
              <div className="font-medium mt-1">—</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">Webhooks</CardTitle>
          <CardDescription>
            Configuración necesaria para recibir mensajes, estados (delivered/read) y eventos.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 text-sm">
          <div className="rounded-lg border p-3">
            <div className="text-muted-foreground">Callback URL</div>
            <div className="font-mono text-xs mt-1 break-all">/api/webhooks/whatsapp</div>
          </div>

          <div className="rounded-lg border p-3">
            <div className="text-muted-foreground">Verify Token</div>
            <div className="font-mono text-xs mt-1">—</div>
          </div>

          <div className="text-muted-foreground">
            (Mock) Aquí luego mostraremos el estado real del webhook y el botón para regenerar el verify token.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}