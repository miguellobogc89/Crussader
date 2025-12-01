// app/auth/reset/ResetClient.tsx
"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";

export default function ResetClient() {
  const sp = useSearchParams();
  const router = useRouter();

  const token = sp.get("token") || "";
  const email = sp.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token || !email) {
      setError("Enlace inválido.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const r = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || data?.ok === false) {
        setError(data?.error ?? "No se pudo restablecer la contraseña.");
      } else {
        setDone(true);
        setTimeout(() => {
          router.push(`/auth/login?email=${encodeURIComponent(email)}`);
        }, 1200);
      }
    } catch (e: any) {
      setError(e?.message ?? "Error de red.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4 relative overflow-hidden">
      {/* Gradient mesh background (igual que login) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(262,83%,58%,0.15)_0%,transparent_50%),radial-gradient(ellipse_at_bottom_right,hsl(217,91%,60%,0.15)_0%,transparent_50%)]" />

      <Card className="w-full max-w-md relative backdrop-blur-sm bg-card/95 border-border shadow-elegant">
        <CardHeader className="space-y-6 pb-4">
          {/* Logo + título con el mismo gradiente que Login/Forgot */}
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
                className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-[hsl(280,100%,70%)] bg-clip-text text-transparent"
              >
                Crussader
              </Link>
            </div>
          </div>

          <div className="flex flex-col items-center space-y-1">
            <h2 className="text-xl font-semibold text-foreground">
              Restablecer contraseña
            </h2>
            <p className="text-xs text-muted-foreground text-center max-w-xs">
              Introduce una nueva contraseña para tu cuenta.
            </p>
          </div>
        </CardHeader>

        <CardContent>
          {done && (
            <div className="mb-4 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Contraseña actualizada. Redirigiendo al inicio de sesión…
            </div>
          )}

          {error && !done && (
            <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {!done && (
            <form className="space-y-4" onSubmit={onSubmit} noValidate>
              <div className="space-y-2">
                <Label htmlFor="reset-password" className="text-foreground">
                  Nueva contraseña
                </Label>
                <Input
                  id="reset-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="bg-background border-border focus:border-primary transition-colors"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Mínimo 6 caracteres.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reset-confirm" className="text-foreground">
                  Confirmar contraseña
                </Label>
                <Input
                  id="reset-confirm"
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="bg-background border-border focus:border-primary transition-colors"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary via-accent to-[hsl(280,100%,70%)] hover:opacity-90 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-60"
              >
                {loading ? "Actualizando…" : "Actualizar contraseña"}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center text-xs text-muted-foreground">
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
