// app/auth/login/LoginClient.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";

export default function LoginClient() {
  const params = useSearchParams();
  const router = useRouter();
  const nextUrl = params.get("next") || "/dashboard";

  const [email, setEmail] = useState(params.get("email") || "");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Para el interruptor visual
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  const verifiedBanner = params.get("verified") === "1";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      callbackUrl: nextUrl,
      redirect: false,
    });

    setLoading(false);

    if (!res) {
      setError("Error desconocido.");
      return;
    }
    if (res.error) {
      const map: Record<string, string> = {
        BAD_CREDENTIALS: "Email o contraseña incorrectos.",
        EMAIL_NOT_VERIFIED: "Verifica tu correo antes de entrar.",
        ACCOUNT_SUSPENDED: "Cuenta suspendida.",
        ACCOUNT_INACTIVE: "Cuenta inactiva.",
        MISSING_CREDENTIALS: "Faltan credenciales.",
      };
      setError(map[res.error] ?? res.error);
      return;
    }

    window.location.href = res.url ?? "/dashboard";
  }

  function handleClickRegister() {
    // Mueve el knob visualmente y luego navega
    setActiveTab("register");
    setTimeout(() => {
      router.push(`/auth/register?next=${encodeURIComponent(nextUrl)}`);
    }, 120);
  }

  useEffect(() => {
    // Aquí podrías usar `remember` para ajustar maxAge dinámicamente vía API
  }, [remember]);

  return (
    <div className="min-h-screen flex justify-center items-start md:items-center bg-gradient-to-br from-background via-background to-muted/20 p-4 relative overflow-hidden overflow-y-auto">
      {/* Gradient mesh background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(262,83%,58%,0.15)_0%,transparent_50%),radial-gradient(ellipse_at_bottom_right,hsl(217,91%,60%,0.15)_0%,transparent_50%)]" />

      <Card className="w-full max-w-md relative backdrop-blur-sm bg-card/95 border-border shadow-elegant">
        <CardHeader className="space-y-6 pb-4">
          {/* Logo + nombre en fila, centrado */}
          <div className="flex items-center justify-center gap-3">
            <Image
              src="/logo/Logo_1-02.png"
              alt="Crussader logo"
              width={40}
              height={40}
              className="object-contain"
              priority
            />
            <Link
              href="/"
              className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-[hsl(280,100%,70%)] bg-clip-text text-transparent"
            >
              Crussader
            </Link>
          </div>

          {/* Toggle estilo interruptor con gradiente */}
          <div className="flex justify-center">
            <div className="inline-flex w-full max-w-xs rounded-full bg-gradient-to-r from-primary via-accent to-[hsl(280,100%,70%)] p-[2px]">
              <div className="relative flex w-full rounded-full bg-background/80 overflow-hidden">
                {/* Knob deslizante */}
                <div
                  className={`absolute inset-y-0 left-0 w-1/2 rounded-full bg-card shadow-sm transition-transform duration-200 ${
                    activeTab === "login" ? "translate-x-0" : "translate-x-full"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setActiveTab("login")}
                  className="relative z-10 flex-1 px-4 py-2.5 rounded-full text-xs sm:text-sm font-medium text-foreground"
                >
                  Iniciar sesión
                </button>
                <button
                  type="button"
                  onClick={handleClickRegister}
                  className="relative z-10 flex-1 px-4 py-2.5 rounded-full text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Crear cuenta
                </button>
              </div>
            </div>
          </div>

          {/* Título / subtítulo */}
          <div className="text-center space-y-1">

          </div>
        </CardHeader>

        <CardContent>
          {verifiedBanner && (
            <div className="mb-4 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              ¡Correo verificado! Ahora introduce tu contraseña para entrar.
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="login-email" className="text-foreground">
                Email
              </Label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="bg-background border-border focus:border-primary transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password" className="text-foreground">
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-background border-border focus:border-primary transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <span className="text-[11px] font-medium">Ocultar</span>
                  ) : (
                    <span className="text-[11px] font-medium">Ver</span>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="accent-primary"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span>Recordar sesión</span>
              </label>
              <a
                href="/auth/forgot"
                className="text-primary hover:underline underline-offset-4"
              >
                Olvidé mi contraseña
              </a>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary via-accent to-[hsl(280,100%,70%)] hover:opacity-90 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-60"
            >
              {loading ? "Entrando…" : "Iniciar sesión"}
            </Button>
          </form>

          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            ¿Problemas para entrar?{" "}
            <a href="/support" className="text-primary hover:underline">
              Soporte
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
