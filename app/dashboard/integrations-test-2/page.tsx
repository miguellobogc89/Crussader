// app/dashboard/integrations-test-2/page.tsx
"use client";

import { useMemo, useState } from "react";
import PageShell from "@/app/components/layouts/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/app/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip";
import { Separator } from "@/app/components/ui/separator";
import { Loader2, Lock } from "lucide-react";

/* ─────────────────────────────────────────────────────────
   Tipos y datos de ejemplo (solo UI, sin llamadas reales)
   ───────────────────────────────────────────────────────── */
type Status = "connected" | "pending" | "disconnected" | "coming-soon";

type Provider = {
  key: string;
  name: string;
  status: Status;
  clickable?: boolean;
  brandIcon: React.ReactNode; // SVG a color
  description?: string;
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.99h5.62c-.24 1.44-1.69 4.24-5.62 4.24-3.38 0-6.14-2.79-6.14-6.25S8.62 5.94 12 5.94c1.93 0 3.23.82 3.98 1.53l2.71-2.62C17.4 3.34 14.93 2.25 12 2.25 6.9 2.25 2.75 6.43 2.75 11.5S6.9 20.75 12 20.75c6.9 0 9.25-4.84 9.25-7.33 0-.49-.05-.82-.12-1.17H12z"
      />
      <path fill="#34A853" d="M3.17 7.14l3.27 2.4C7.26 7.9 9.42 6.06 12 6.06c1.93 0 3.23.82 3.98 1.53l2.71-2.62C17.4 3.34 14.93 2.25 12 2.25 8.18 2.25 4.86 4.44 3.17 7.14z" />
      <path fill="#FBBC05" d="M12 20.75c3.93 0 6.9-2.58 7.62-5.36l-3.51-2.7c-.46 1.39-1.89 3.07-4.11 3.07-2.49 0-4.6-1.77-5.2-4.14L3.11 13c1.06 3.4 4.35 7.75 8.89 7.75z" />
      <path fill="#4285F4" d="M21.25 13.42c0-.49-.05-.82-.12-1.17H12v3.99h5.62c-.24 1.44-1.69 4.24-5.62 4.24v0c3.9 0 9.25-2.79 9.25-7.06z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
      <defs>
        <linearGradient id="ig-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F58529" />
          <stop offset="30%" stopColor="#DD2A7B" />
          <stop offset="60%" stopColor="#8134AF" />
          <stop offset="100%" stopColor="#515BD4" />
        </linearGradient>
      </defs>
      <path
        fill="url(#ig-grad)"
        d="M7 2h10c2.76 0 5 2.24 5 5v10c0 2.76-2.24 5-5 5H7c-2.76 0-5-2.24-5-5V7c0-2.76 2.24-5 5-5zm0 2C5.9 4 5 4.9 5 6v12c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H7zm5 3.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zM18.5 6a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
      <path fill="#1877F2" d="M22 12a10 10 0 1 0-11.5 9.9v-7H7.9V12h2.6V9.8c0-2.6 1.6-4 3.9-4 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.3 0-1.7.8-1.7 1.6V12h2.9l-.5 2.9h-2.4v7A10 10 0 0 0 22 12z" />
      <path fill="#fff" d="M15.5 14.9 16 12h-2.9V9.9c0-.8.4-1.6 1.7-1.6H16V5.8s-1.1-.2-2.2-.2c-2.3 0-3.9 1.4-3.9 4V12H7.3v2.9h2.6v7a10.1 10.1 0 0 0 2.6 0v-7h2.4z" />
    </svg>
  );
}

function TrustpilotIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
      <path fill="#00B67A" d="M12 2l2.47 6.9h7.26l-5.88 4.27 2.47 6.9L12 15.8l-6.32 4.27 2.47-6.9L2.27 8.9h7.26L12 2z" />
      <path fill="#005128" d="M12 2v13.8l-6.32 4.27 2.47-6.9L2.27 8.9h7.26L12 2z" />
    </svg>
  );
}

function BookingIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
      <rect x="2" y="3" width="20" height="18" rx="4" fill="#003580" />
      <circle cx="16.5" cy="15" r="2.5" fill="#00A1DE" />
    </svg>
  );
}

function SoonBadge() {
  return (
    <Badge variant="secondary" className="rounded-full border border-dashed">
      Próximamente
    </Badge>
  );
}

function StatusBadge({ status }: { status: Status }) {
  if (status === "connected") return <Badge className="rounded-full bg-emerald-600 hover:bg-emerald-600">Conectado</Badge>;
  if (status === "pending") return <Badge className="rounded-full bg-amber-500 hover:bg-amber-500">Pendiente</Badge>;
  if (status === "disconnected") return <Badge variant="outline" className="rounded-full">Sin conexión</Badge>;
  return <SoonBadge />;
}

export default function IntegrationsPage() {
  const [busy, setBusy] = useState(false);
  const [igUsername, setIgUsername] = useState("");
  const [igRedirectUri, setIgRedirectUri] = useState("");

  // Estado para mostrar el JSON en la propia página
  const [gbJson, setGbJson] = useState<any | null>(null);
  const [loadingJson, setLoadingJson] = useState(false);

  const providers: Provider[] = useMemo(
    () => [
      {
        key: "google",
        name: "Google",
        status: "disconnected",
        clickable: true,
        brandIcon: <GoogleIcon />,
        description: "Conecta tu Perfil de Empresa para traer reseñas y responder desde Crussader.",
      },
      {
        key: "instagram",
        name: "Instagram",
        status: "pending",
        clickable: true,
        brandIcon: <InstagramIcon />,
        description: "Conecta tu cuenta profesional para leer DMs y menciones (revisión requerida).",
      },
      {
        key: "facebook",
        name: "Facebook",
        status: "coming-soon",
        brandIcon: <FacebookIcon />,
        description: "Páginas, reseñas y mensajes.",
      },
      {
        key: "trustpilot",
        name: "Trustpilot",
        status: "coming-soon",
        brandIcon: <TrustpilotIcon />,
        description: "Sincroniza tus valoraciones.",
      },
      {
        key: "booking",
        name: "Booking.com",
        status: "coming-soon",
        brandIcon: <BookingIcon />,
        description: "Reseñas de alojamiento.",
      },
    ],
    []
  );

  // ─── Lanzar flujo de conexión con Google ─────────────────────────────
  function connectGoogle(opts?: { locationId?: string; returnTo?: string }) {
    const params = new URLSearchParams();
    if (opts?.locationId) params.set("locationId", opts.locationId);
    params.set("returnTo", opts?.returnTo ?? "/dashboard/integrations-test-2");
    window.location.href = `/api/connect/google-business/start?${params.toString()}`;
  }

  // ─── Ver JSON crudo en nueva pestaña ──────────────────────────────────
  function openGoogleJsonInNewTab() {
    window.open("/api/connect/google-business/test", "_blank", "noopener,noreferrer");
  }

  // ─── Cargar JSON y mostrarlo en la página ─────────────────────────────
  async function loadGoogleJsonHere() {
    try {
      setLoadingJson(true);
      const res = await fetch("/api/connect/google-business/test", { cache: "no-store" });
      const data = await res.json();
      setGbJson(data);
    } catch (e) {
      console.error("Error al descargar JSON:", e);
      setGbJson({ ok: false, error: "download_failed" });
    } finally {
      setLoadingJson(false);
    }
  }

  return (
    <PageShell
      title="Conexiones"
      description="Elige qué plataformas quieres conectar a tu negocio. Google e Instagram están disponibles; el resto, muy pronto."
    >
      <div className="space-y-6">
        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Estado general</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Badge className="rounded-full bg-emerald-600">2 activas (demo)</Badge>
            <Badge variant="outline" className="rounded-full">0 errores</Badge>
            <Badge variant="secondary" className="rounded-full">4 próximas</Badge>
          </CardContent>
        </Card>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Google */}
          <Card className="group relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="shrink-0">{providers[0].brandIcon}</div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{providers[0].name}</h3>
                    <StatusBadge status={providers[0].status} />
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{providers[0].description}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button
                  variant="default"
                  onClick={() =>
                    connectGoogle({
                      // locationId: selectedLocationId, // si la tienes
                      returnTo: "/dashboard/integrations-test-2",
                    })
                  }
                >
                  Conectar Google
                </Button>
                <Button variant="outline" onClick={openGoogleJsonInNewTab}>
                  Ver JSON
                </Button>
                <Button variant="outline" onClick={loadGoogleJsonHere} disabled={loadingJson}>
                  {loadingJson ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Cargando…</> : "Cargar JSON aquí"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Instagram (abre modal de conexión) */}
          <Dialog>
            <Card className="group relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="shrink-0">{providers[1].brandIcon}</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{providers[1].name}</h3>
                      <StatusBadge status={providers[1].status} />
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{providers[1].description}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <DialogTrigger asChild>
                    <Button variant="default">Conectar Instagram</Button>
                  </DialogTrigger>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline">
                          <Lock className="mr-2 h-4 w-4" />
                          Revisión
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        Debes usar cuenta profesional y aportar un flujo de login verificable (solo UI por ahora).
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardContent>
            </Card>

            {/* Modal IG: solo UI para simular el flujo */}
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Conectar Instagram</DialogTitle>
                <DialogDescription>
                  Este es un flujo de ejemplo. Introduce tus datos y simularemos la redirección de OAuth.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <div className="grid gap-2">
                  <Label htmlFor="ig-username">Usuario (profesional)</Label>
                  <Input
                    id="ig-username"
                    placeholder="@tu_negocio"
                    value={igUsername}
                    onChange={(e) => setIgUsername(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ig-redirect">Redirect URI</Label>
                  <Input
                    id="ig-redirect"
                    placeholder="https://tu-dominio.com/api/instagram/callback"
                    value={igRedirectUri}
                    onChange={(e) => setIgRedirectUri(e.target.value)}
                  />
                </div>
                <Separator />
                <p className="text-xs text-muted-foreground">
                  Al continuar, serás redirigido a Instagram para conceder permisos a tu cuenta profesional. (Demo: no
                  se realiza ninguna llamada).
                </p>
              </div>

              <DialogFooter className="gap-2">
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button
                  disabled={busy}
                  onClick={() => {
                    setBusy(true);
                    // Simulación de “trabajando”
                    setTimeout(() => {
                      setBusy(false);
                    }, 1000);
                  }}
                >
                  {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Continuar con Instagram
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Facebook (Próximamente) */}
          <Card className="relative overflow-hidden opacity-80">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="shrink-0">{providers[2].brandIcon}</div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{providers[2].name}</h3>
                    <StatusBadge status={providers[2].status} />
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{providers[2].description}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <Button variant="secondary" disabled>
                  Conectar
                </Button>
                <Button variant="outline" disabled>
                  Detalles
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Trustpilot (Próximamente) */}
          <Card className="relative overflow-hidden opacity-80">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="shrink-0">{providers[3].brandIcon}</div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{providers[3].name}</h3>
                    <StatusBadge status={providers[3].status} />
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{providers[3].description}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <Button variant="secondary" disabled>
                  Conectar
                </Button>
                <Button variant="outline" disabled>
                  Detalles
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Booking (Próximamente) */}
          <Card className="relative overflow-hidden opacity-80">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="shrink-0">{providers[4].brandIcon}</div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{providers[4].name}</h3>
                    <StatusBadge status={providers[4].status} />
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{providers[4].description}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <Button variant="secondary" disabled>
                  Conectar
                </Button>
                <Button variant="outline" disabled>
                  Detalles
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Panel opcional para mostrar aquí el JSON */}
        {gbJson && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Resultado JSON — Google Business</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="max-h-[480px] overflow-auto rounded border bg-muted/50 p-3 text-xs">
{JSON.stringify(gbJson, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
