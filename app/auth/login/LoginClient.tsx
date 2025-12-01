// app/auth/login/LoginClient.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import { Eye, EyeOff, Loader2 } from "lucide-react";

type AuthMode = "login" | "register";

export default function LoginClient() {
  const params = useSearchParams();
  const nextUrl = params.get("next") || "/dashboard";

  const [mode, setMode] = useState<AuthMode>("login");

  const [email, setEmail] = useState(params.get("email") || "");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [success, setSuccess] = useState(false);
  const [verifyUrl, setVerifyUrl] = useState<string | null>(null);

  const verifiedBanner = params.get("verified") === "1";

  const isLogin = mode === "login";

  const isRegisterFormValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.trim().length > 0 &&
    confirmPassword.trim().length > 0 &&
    password === confirmPassword &&
    acceptedTerms;

  async function onLoginSubmit(e: React.FormEvent) {
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

  async function onRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setVerifyUrl(null);

    // Validaciones básicas
    if (!firstName.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    if (!lastName.trim()) {
      setError("Los apellidos son obligatorios.");
      return;
    }
    if (!email.trim()) {
      setError("El email es obligatorio.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (!acceptedTerms) {
      setError("Debes aceptar los términos y condiciones.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          acceptTerms: true,
          next: nextUrl,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.ok === false) {
        const err = data?.error as string | undefined;

        const msg =
          data?.message ||
          (err === "EMAIL_ALREADY_EXISTS"
            ? "Ya existe una cuenta con este email."
            : err === "INVITE_CODE_REQUIRED"
            ? "Este entorno requiere código de invitación."
            : "No se pudo crear la cuenta.");
        setError(msg);
        return;
      }

      const modeFromApi = data?.mode as "invite" | "email_verify" | undefined;

      // Modo invitación: login automático
      if (modeFromApi === "invite") {
        const loginRes = await signIn("credentials", {
          email,
          password,
          callbackUrl: nextUrl,
          redirect: false,
        });

        if (loginRes && !loginRes.error) {
          window.location.href = loginRes.url ?? nextUrl;
          return;
        }

        window.location.href = `/auth/login?email=${encodeURIComponent(email)}`;
        return;
      }

      // Modo verificación por email (producción y local)
      setSuccess(true);
      if (data?.verifyUrl && process.env.NODE_ENV !== "production") {
        setVerifyUrl(data.verifyUrl as string);
      }
      // NO redirigimos: nos quedamos en la pestaña "Crear cuenta" mostrando el banner
    } catch (err: any) {
      setError(err?.message ?? "Error de red.");
    } finally {
      setLoading(false);
    }
  }

  async function onGoogleClick() {
    try {
      setGoogleLoading(true);
      await signIn("google", {
        callbackUrl: nextUrl,
      });
    } catch (err) {
      console.error(err);
      setGoogleLoading(false);
    }
  }

  useEffect(() => {
    // Aquí podrías usar `remember` para ajustar maxAge dinámicamente vía API
  }, [remember]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(262,83%,58%,0.15)_0%,transparent_50%),radial-gradient(ellipse_at_bottom_right,hsl(217,91%,60%,0.15)_0%,transparent_50%)]" />

      <Card className="w-full max-w-md relative backdrop-blur-sm bg-card/95 border-border shadow-elegant">
        <CardHeader className="space-y-6 pb-4">
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

          <div className="flex flex-col items-center space-y-3">
            <div className="inline-flex rounded-full bg-muted p-1 text-sm">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className={[
                  "px-4 py-1 rounded-full transition-all",
                  isLogin
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setError(null);
                }}
                className={[
                  "px-4 py-1 rounded-full transition-all",
                  !isLogin
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                Crear cuenta
              </button>
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-xl font-semibold text-foreground">
                {isLogin ? "Iniciar sesión" : "Crea tu cuenta"}
              </h2>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLogin && verifiedBanner && (
            <div className="mb-4 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              ¡Correo verificado! Ahora introduce tu contraseña para entrar.
            </div>
          )}

          {/* Banner de "correo enviado" ahora solo depende de success */}
          {!isLogin && success && (
            <div className="mb-4 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Te hemos enviado un correo para <strong>verificar</strong> tu cuenta.
              {verifyUrl && process.env.NODE_ENV !== "production" && (
                <>
                  {" "}
                  (dev){" "}
                  <a
                    href={verifyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-emerald-700"
                  >
                    Abrir enlace de verificación
                  </a>
                </>
              )}
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {isLogin ? (
            /* FORM LOGIN */
            <form className="space-y-4" onSubmit={onLoginSubmit}>
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
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary via-accent to-[hsl(280,100%,70%)] hover:opacity-90 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-60"
              >
                {loading ? "Entrando…" : "Iniciar sesión"}
              </Button>
            </form>
          ) : (
            /* FORM REGISTRO */
            <>
              {success && verifyUrl && (
                <div className="mb-4 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  Te hemos enviado un correo para{" "}
                  <strong>verificar</strong> tu cuenta.
                </div>
              )}

              {!success && (
                <form className="space-y-4" onSubmit={onRegisterSubmit}>
                  {/* FILA 1 - Nombre / Apellidos */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="register-firstname"
                        className="text-foreground"
                      >
                        Nombre
                      </Label>
                      <Input
                        id="register-firstname"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Tu nombre"
                        required
                        className="bg-background border-border focus:border-primary transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="register-lastname"
                        className="text-foreground"
                      >
                        Apellidos
                      </Label>
                      <Input
                        id="register-lastname"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Tus apellidos"
                        required
                        className="bg-background border-border focus:border-primary transition-colors"
                      />
                    </div>
                  </div>

                  {/* FILA 2 - Email */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="register-email"
                      className="text-foreground"
                    >
                      Correo electrónico
                    </Label>
                    <Input
                      id="register-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      required
                      className="bg-background border-border focus:border-primary transition-colors"
                    />
                  </div>

                  {/* FILA 3 - Contraseña / Confirmar */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="register-password"
                        className="text-foreground"
                      >
                        Contraseña
                      </Label>
                      <Input
                        id="register-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="bg-background border-border focus:border-primary transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="register-confirm"
                        className="text-foreground"
                      >
                        Confirmar contraseña
                      </Label>
                      <Input
                        id="register-confirm"
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="bg-background border-border focus:border-primary transition-colors"
                      />
                    </div>
                  </div>

                  {/* Términos y condiciones */}
                  <div className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      id="terms"
                      className="mt-[3px] accent-primary"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      required
                    />
                    <label htmlFor="terms" className="leading-tight">
                      Acepto los{" "}
                      <a
                        href="https://crussader.com/terms.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        términos y condiciones
                      </a>
                      .
                    </label>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || !isRegisterFormValid}
                    className="w-full bg-gradient-to-r from-primary via-accent to-[hsl(280,100%,70%)] hover:opacity-90 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Creando cuenta…</span>
                      </>
                    ) : (
                      "Crear cuenta"
                    )}
                  </Button>
                </form>
              )}
            </>
          )}

          {/* Divider + Google button */}
          <div className="mt-6">
            <div className="relative flex items-center gap-3 text-[11px] text-muted-foreground uppercase tracking-wide">
              <div className="flex-1 h-px bg-border" />
              <span>o continúa con</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={onGoogleClick}
              disabled={googleLoading}
              className="mt-3 w-full bg-background/60 hover:bg-muted border-border text-foreground hover:text-foreground flex items-center justify-center gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Conectando con Google…</span>
                </>
              ) : (
                <>
                  <Image
                    src="/platform-icons/google-business.png"
                    alt="Google"
                    width={20}
                    height={20}
                    className="object-contain"
                  />
                  <span>Continuar con Google</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
