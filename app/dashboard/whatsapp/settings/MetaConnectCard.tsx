// app/dashboard/whatsapp/settings/MetaConnectCard.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

import { useBootstrapStore } from "@/app/providers/bootstrap-store";

import {
  Loader2,
  MoreVertical,
  Plus,
  Trash2,
  TriangleAlert,
  Wrench,
} from "lucide-react";

declare global {
  interface Window {
    FB?: {
      init: (opts: { appId: string; cookie: boolean; xfbml: boolean; version: string }) => void;
      login: (
        cb: (resp: { status?: string; authResponse?: { accessToken?: string } }) => void,
        opts: { config_id: string; response_type?: string; override_default_response_type?: boolean }
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

type PhoneStatus = "active" | "pending" | "disabled";

type PhoneItem = {
  source: "company_phone_number" | "integration_installation";
  id: string;
  companyId: string;
  locationId: string | null;
  status: PhoneStatus;
  phoneNumberId: string | null;
  displayPhoneNumber: string | null;
  phoneNumberE164: string | null;
  wabaId: string | null;
  installationId: string | null;
};

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

function statusLabel(status: PhoneStatus) {
  if (status === "active") return "Conectado";
  if (status === "pending") return "Pendiente";
  return "Desactivado";
}

function statusVariant(status: PhoneStatus): "default" | "secondary" | "destructive" {
  if (status === "active") return "default";
  if (status === "pending") return "secondary";
  return "destructive";
}

function bestPhone(p: PhoneItem) {
  const a = String(p.displayPhoneNumber || "").trim();
  if (a.length > 0) return a;
  const b = String(p.phoneNumberE164 || "").trim();
  if (b.length > 0) return b;
  return "—";
}

export default function MetaConnectCard() {
  const companyId = useBootstrapStore((s) => s.data?.activeCompanyResolved?.id ?? null);

  const [sdkReady, setSdkReady] = useState(false);
  const [busy, setBusy] = useState(false);

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PhoneItem[]>([]);
  const [err, setErr] = useState<string>("");

  const appId = useMemo(() => process.env.NEXT_PUBLIC_META_APP_ID ?? "", []);
  const configId = useMemo(() => process.env.NEXT_PUBLIC_WA_EMBEDDED_SIGNUP_CONFIG_ID ?? "", []);

  // SDK
  useEffect(() => {
    if (!appId) return;

    loadFacebookSdk(appId)
      .then(() => setSdkReady(true))
      .catch((e) => {
        console.error("[WA] SDK load error:", e);
        setSdkReady(false);
      });
  }, [appId]);

  async function refreshList(cid: string) {
    setErr("");
    setLoading(true);

    try {
      const res = await fetch(
        `/api/whatsapp/phoneNumbers?companyId=${encodeURIComponent(cid)}`,
        { cache: "no-store" }
      );

      if (!res.ok) {
        const j = await res.json().catch(() => null);
        const msg = j && typeof j.error === "string" ? j.error : "No se pudo cargar la lista.";
        throw new Error(msg);
      }

      const j = (await res.json()) as { ok?: boolean; items?: PhoneItem[] };
      const next = Array.isArray(j.items) ? j.items : [];
      setItems(next);
    } catch (e: any) {
      setItems([]);
      setErr(String(e?.message || "Error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const cid = String(companyId || "").trim();
    if (!cid) {
      setItems([]);
      setLoading(false);
      return;
    }
    refreshList(cid);
  }, [companyId]);

  // Embedded Signup callback -> register -> refresh
useEffect(() => {
  function handleMessage(event: MessageEvent) {
    if (!event.data) return;

    let data: any = event.data;

    // Meta a veces envía string JSON
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch {
        return;
      }
    }

    if (data.type !== "WA_EMBEDDED_SIGNUP") return;

    const payload = data.payload || {};

    const wabaId = payload.waba_id;
    const phoneNumberId = payload.phone_number_id;
    const displayPhoneNumber = payload.display_phone_number;

    if (!wabaId || !phoneNumberId) return;

    const cid = String(companyId || "").trim();
    if (!cid) return;

    // LOG IMPORTANTE
    console.log("[WA][EMBEDDED_SIGNUP]", {
      companyId: cid,
      wabaId,
      phoneNumberId,
      displayPhoneNumber,
    });

    fetch("/api/whatsapp/phone-numbers/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId: cid,
        wabaId,
        phoneNumberId,
        displayPhoneNumber,
        phoneNumberE164: displayPhoneNumber,
        status: "active",
      }),
    })
      .then(async (r) => {
        if (!r.ok) {
          const j = await r.json().catch(() => null);
          const msg =
            j && typeof j.error === "string"
              ? j.error
              : "No se pudo registrar el número.";
          throw new Error(msg);
        }
      })
      .then(() => refreshList(cid))
      .catch((e) => {
        console.error("[WA] register error:", e);
        setErr(String(e?.message || "Error"));
      });
  }

  window.addEventListener("message", handleMessage);
  return () => window.removeEventListener("message", handleMessage);
}, [companyId]);

async function handleConnect() {
    console.log("[WA][CONNECT] handleConnect ENTER");
  setErr("");

  const cid = String(companyId || "").trim();
  if (!cid) {
    setErr("No hay empresa activa (companyId).");
    return;
  }

  if (!appId || !configId) {
    setErr("Faltan env vars: NEXT_PUBLIC_META_APP_ID o NEXT_PUBLIC_WA_EMBEDDED_SIGNUP_CONFIG_ID");
    return;
  }

  setBusy(true);

  try {
    await loadFacebookSdk(appId);

    if (!window.FB) {
      setBusy(false);
      setErr("Facebook SDK no disponible (window.FB undefined)");
      return;
    }

    console.log("[WA][CONNECT] click", {
      appId,
      configId,
      origin: window.location.origin,
    });

    window.FB.login(
      (resp: any) => {
        console.log("[WA][CONNECT] FB.login resp", resp);
        setBusy(false);
      },
      {
        config_id: configId,
        response_type: "code",
        override_default_response_type: true,
      }
    );
  } catch (e) {
    console.error("[WA] handleConnect error:", e);
    setBusy(false);
    setErr("No se pudo iniciar el flujo de Meta. Mira consola.");
  }
}

  async function handleDelete(item: PhoneItem) {
    // OJO: tu “número en uso” ahora vive en integration_installation.config.
    // El delete real no lo podemos inventar aquí: por ahora solo UI.
    setErr("Borrar aún no está implementado (depende de cómo quieras desasociar el installation).");
    console.log("[WA] delete clicked for", item);
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Números de WhatsApp</CardTitle>
            <CardDescription>
              Lista de números conectados a tu empresa.
            </CardDescription>
          </div>

          <Button type="button" onClick={handleConnect}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Añadir número
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {err.length > 0 ? (
          <div className="rounded-xl border p-3 text-sm flex gap-2">
            <TriangleAlert className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <div className="font-medium">Aviso</div>
              <div className="text-muted-foreground break-words">{err}</div>
            </div>
          </div>
        ) : null}

        <div className="rounded-xl border overflow-hidden">
          <div className="grid grid-cols-12 gap-0 bg-muted/30 px-4 py-3 text-xs font-semibold">
            <div className="col-span-6">Número</div>
            <div className="col-span-3">Estado</div>
            <div className="col-span-2">Origen</div>
            <div className="col-span-1 text-right"> </div>
          </div>

          <Separator />

          {loading ? (
            <div className="px-4 py-6 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando…
            </div>
          ) : null}

          {!loading && items.length === 0 ? (
            <div className="px-4 py-6 text-sm text-muted-foreground">
              No hay números conectados.
            </div>
          ) : null}

          {!loading && items.length > 0 ? (
            <div className="divide-y">
              {items.map((p) => (
                <div key={p.id} className="grid grid-cols-12 items-center px-4 py-3 text-sm">
                  <div className="col-span-6">
                    <div className="font-medium">{bestPhone(p)}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.phoneNumberId ? `Phone Number ID: ${p.phoneNumberId}` : null}
                    </div>
                  </div>

                  <div className="col-span-3">
                    <Badge variant={statusVariant(p.status)}>{statusLabel(p.status)}</Badge>
                  </div>

                  <div className="col-span-2">
                    <Badge variant="outline">
                      {p.source === "integration_installation" ? "Instalación" : "Tabla"}
                    </Badge>
                  </div>

                  <div className="col-span-1 flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2" onClick={handleConnect} disabled={!sdkReady || busy}>
                          <Wrench className="h-4 w-4" />
                          Añadir otro número
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="gap-2 text-destructive focus:text-destructive"
                          onClick={() => handleDelete(p)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Borrar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="text-xs text-muted-foreground">
          {sdkReady ? "Meta listo." : "Meta no cargó (APP ID / dominio)."}
        </div>
      </CardContent>
    </Card>
  );
}