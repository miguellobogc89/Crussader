// app/auth/AuthClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import { Shield, Eye, EyeOff } from "lucide-react";

type Props = { initialTab: "login" | "register" };

export default function AuthClient({ initialTab }: Props) {
  const [tab, setTab] = useState<"login" | "register">(initialTab);

  // URL params (para post-verify / next)
  const params = useSearchParams();
  const [nextUrl, setNextUrl] = useState("/dashboard");

  // LOGIN state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // REGISTER state
  const [name, setName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [accept, setAccept] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState(false);
  const [devVerifyUrl, setDevVerifyUrl] = useState<string | null>(null); // solo dev
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);

  // Leer parámetros de verificación y next
  useEffect(() => {
    const v = params.get("verified");
    const em = params.get("email");
    const n = params.get("next");

    if (v === "1") {
      setTab("login");
      if (em) setLoginEmail(em); // pre-rellena email tras verificar
    }
    if (n) setNextUrl(n);
  }, [params]);

  const verifiedBanner = params.get("verified") === "1";

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    const res = await signIn("credentials", {
      email: loginEmail,
      password: loginPassword,
      callbackUrl: nextUrl, // respeta ?next o /dashboard
      redirect: false,
    });

    setLoginLoading(false);
    if (!res) {
      setLoginError("Error desconocido.");
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
      setLoginError(map[res.error] ?? res.error);
      return;
    }
    window.location.href = res.url ?? "/dashboard";
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegError(null);

    if (!accept) {
      setRegError("Debes aceptar los Términos y la Privacidad.");
      return;
    }
    if (password.length < 6) {
      setRegError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setRegError("Las contraseñas no coinciden.");
      return;
    }

    setRegLoading(true);
    try {
      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: regEmail,
          password,
          acceptTerms: true,
        }),
      });

      const data = await r.json().catch(() => ({} as any));
      if (!r.ok || data?.ok === false) {
        setRegError(data?.error ?? "No se pudo crear la cuenta.");
      } else {
        setRegSuccess(true); // “verifica tu correo”
        if (data?.verifyUrl && process.env.NODE_ENV !== "production") {
          setDevVerifyUrl(data.verifyUrl);
          console.info("[DEV] Enlace de verificación:", data.verifyUrl);
        }
      }
    } catch (err: any) {
      setRegError(err?.message ?? "Error de red.");
    } finally {
      setRegLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4 relative overflow-hidden">
      {/* Gradient mesh background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(262,83%,58%,0.15)_0%,transparent_50%),radial-gradient(ellipse_at_bottom_right,hsl(217,91%,60%,0.15)_0%,transparent_50%)]" />

      <Card className="w-full max-w-md relative backdrop-blur-sm bg-card/95 border-border shadow-elegant">
        <CardHeader className="space-y-6 pb-4">
          {/* Logo */}
          <div className="flex flex-col items-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-accent to-[hsl(280,100%,70%)] flex items-center justify-center shadow-glow">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-[hsl(280,100%,70%)] bg-clip-text text-transparent">
              Crussader
            </h1>
          </div>

          {/* Tabs login / register */}
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <button
              type="button"
              onClick={() => setTab("login")}
              className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                tab === "login"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => setTab("register")}
              className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                tab === "register"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Crear cuenta
            </button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Aviso tras verificar */}
          {verifiedBanner && tab === "login" && (
            <div className="mb-4 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              ¡Correo verificado! Ahora introduce tu contraseña para entrar.
            </div>
          )}

          <form
            onSubmit={tab === "login" ? handleLogin : handleRegister}
            className="space-y-4"
          >
            {tab === "login" ? (
              <>
                {loginError && (
                  <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {loginError}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-foreground">
                    Correo electrónico
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className="bg-background border-border focus:border-primary transition-colors"
                    placeholder="tu@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-foreground">
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showLoginPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="bg-background border-border focus:border-primary transition-colors pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showLoginPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
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
                  disabled={loginLoading}
                  className="w-full bg-gradient-to-r from-primary via-accent to-[hsl(280,100%,70%)] hover:opacity-90 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-60"
                >
                  {loginLoading ? "Entrando…" : "Iniciar sesión"}
                </Button>
              </>
            ) : (
              <>
                {regSuccess ? (
                  <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                    Te hemos enviado un correo para verificar tu cuenta. Revisa tu
                    bandeja.
                    {devVerifyUrl && process.env.NODE_ENV !== "production" && (
                      <>
                        {" "}
                        En desarrollo puedes verificar directamente:{" "}
                        <a
                          href={devVerifyUrl}
                          className="underline text-emerald-700 hover:text-emerald-900"
                          target="_blank"
                        >
                          Verificar ahora
                        </a>
                      </>
                    )}
                  </div>
                ) : regError ? (
                  <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {regError}
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="reg-name" className="text-foreground">
                    Nombre
                  </Label>
                  <Input
                    id="reg-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-background border-border focus:border-primary transition-colors"
                    placeholder="Tu nombre"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-email" className="text-foreground">
                    Correo electrónico
                  </Label>
                  <Input
                    id="reg-email"
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    className="bg-background border-border focus:border-primary transition-colors"
                    placeholder="tu@email.com"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-password" className="text-foreground">
                      Contraseña
                    </Label>
                    <div className="relative">
                      <Input
                        id="reg-password"
                        type={showRegPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-background border-border focus:border-primary transition-colors pr-10"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showRegPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-confirm" className="text-foreground">
                      Confirmar contraseña
                    </Label>
                    <div className="relative">
                      <Input
                        id="reg-confirm"
                        type={showRegConfirm ? "text" : "password"}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                        className="bg-background border-border focus:border-primary transition-colors pr-10"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegConfirm(!showRegConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showRegConfirm ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <label className="flex items-start gap-3 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    className="mt-1 accent-primary"
                    checked={accept}
                    onChange={(e) => setAccept(e.target.checked)}
                  />
                  <span>
                    Acepto los{" "}
                    <a
                      href="/legal/terms"
                      className="text-primary hover:underline"
                    >
                      Términos y Condiciones
                    </a>{" "}
                    y la{" "}
                    <a
                      href="/legal/privacy"
                      className="text-primary hover:underline"
                    >
                      Política de Privacidad
                    </a>
                    .
                  </span>
                </label>

                <Button
                  type="submit"
                  disabled={regLoading || regSuccess}
                  className="w-full bg-gradient-to-r from-primary via-accent to-[hsl(280,100%,70%)] hover:opacity-90 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-60"
                >
                  {regLoading
                    ? "Creando cuenta…"
                    : regSuccess
                    ? "Correo enviado"
                    : "Crear cuenta"}
                </Button>
              </>
            )}
          </form>

          <p className="mt-6 text-center text-[11px] text-muted-foreground">
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
