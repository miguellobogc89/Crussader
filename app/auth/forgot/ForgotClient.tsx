// app/auth/forgot/ForgotClient.tsx
"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";

export default function ForgotClient() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const r = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await r.json().catch(() => ({}));

      if (!r.ok || data?.ok === false) {
        setError(data?.error ?? "No se pudo procesar la solicitud.");
      } else {
        setSent(true);
        if (data?.resetUrl && process.env.NODE_ENV !== "production") {
          setDevResetUrl(data.resetUrl);
        }
      }
    } catch (e: any) {
      setError(e?.message ?? "Error de red.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden text-slate-50"
      style={{
        // mismo fondo que LoginClient
        background: "radial-gradient(circle at top, #1f2937 0, #020617 55%)",
      }}
    >
      {/* glow rosa/azul suave por detrás, como en LoginClient */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(262,83%,58%,0.16)_0%,transparent_55%),radial-gradient(ellipse_at_bottom_right,hsl(217,91%,60%,0.18)_0%,transparent_55%)]" />

      <Card className="w-full max-w-md relative overflow-hidden border border-slate-700/70 bg-slate-950/75 backdrop-blur-xl shadow-[0_18px_45px_rgba(15,23,42,0.85)]">
        {/* halo suave de color en el panel */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,#a855f71f,transparent_55%),radial-gradient(circle_at_bottom,#38bdf81a,transparent_55%)]" />

        <CardHeader className="space-y-6 pb-4 relative z-10">
          {/* Logo + título mismo estilo que LoginClient */}
          <div className="flex flex-col items-center space-y-3">
            <div className="flex items-center gap-3">
              <div
                className="
                  w-10 h-10 
                  bg-[linear-gradient(90deg,var(--tw-gradient-stops))]
                  from-primary via-accent to-[hsl(280,100%,70%)]
                  [mask:url('/logo/Logo%201-05.svg')]
                  [mask-size:contain]
                  [mask-repeat:no-repeat]
                  [mask-position:center]
                "
              />
              <Link
                href="/"
                className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-[hsl(280,100%,70%)] bg-clip-text text-white"
              >
                Crussader
              </Link>
            </div>
          </div>

          <div className="flex flex-col items-center space-y-1">
            <h2 className="text-xl font-semibold text-slate-50">
              Recuperar contraseña
            </h2>
            <p className="text-xs text-slate-400 text-center max-w-xs">
              Te enviaremos un enlace para restablecer tu contraseña si el correo
              existe en Crussader.
            </p>
          </div>
        </CardHeader>

        <CardContent className="relative z-10">
          {sent && (
            <div className="mb-4 rounded-md border border-emerald-400/70 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
              Si el correo existe, te hemos enviado un enlace para restablecer tu
              contraseña.
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-md border border-red-400/70 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          {!sent && (
            <form className="space-y-4" onSubmit={onSubmit} noValidate>
              <div className="space-y-2">
                <Label htmlFor="forgot-email" className="text-slate-50">
                  Email
                </Label>
                <Input
                  id="forgot-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="bg-slate-950/70 border-slate-700 focus:border-primary transition-colors text-slate-50 placeholder:text-slate-500"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary via-accent to-[hsl(280,100%,70%)] hover:opacity-90 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-60"
              >
                {loading ? "Enviando…" : "Enviar enlace"}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center text-xs text-slate-400">
            <Link
              href="/auth/login"
              className="text-primary hover:underline underline-offset-4"
            >
              Volver a iniciar sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
