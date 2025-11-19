// app/auth/register/RegisterClient.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";

export default function RegisterClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const nextUrl = (sp.get("next") as string) || "/dashboard";

  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [inviteCode, setInviteCode] = useState(
    (sp.get("code") || "").toUpperCase()
  );
  const [accept,    setAccept]    = useState(false);
  const [marketing, setMarketing] = useState(false);

  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState<string | null>(null);
  const [success, setSuccess]   = useState(false);
  const [devVerifyUrl, setDevVerifyUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<"invite" | "email_verify" | null>(null);

  // Interruptor visual: aquí activo "register"
  const [activeTab, setActiveTab] = useState<"login" | "register">("register");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!firstName.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    if (!lastName.trim()) {
      setError("Los apellidos son obligatorios.");
      return;
    }
    if (!accept) {
      setError("Debes aceptar los Términos y la Privacidad.");
      return;
    }
    if (!email || !password) {
      setError("Email y contraseña son obligatorios.");
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
    if (!inviteCode.trim()) {
      setError(
        "El código de invitación es obligatorio para acceder a la beta."
      );
      return;
    }

    setLoading(true);
    try {
      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          inviteCode: inviteCode.trim(),
          acceptTerms: true,
          marketingOptIn: marketing,
          next: nextUrl,
        }),
      });

      const data = await r.json().catch(() => ({} as any));

      if (!r.ok || data?.ok === false) {
        const err = data?.error as string | undefined;

        const msg =
          data?.message ||
          (err === "INVALID_INVITE_CODE"
            ? "Código de invitación no válido o caducado."
            : err === "INVITE_EMAIL_MISMATCH"
            ? "El código no corresponde a este correo."
            : err === "INVITE_MAX_USES_REACHED"
            ? "Este código ya ha sido utilizado."
            : err === "EMAIL_ALREADY_EXISTS"
            ? "Ya existe una cuenta con este email."
            : err === "INVITE_CODE_REQUIRED"
            ? "El código de invitación es obligatorio."
            : "No se pudo crear la cuenta.");
        setError(msg);
        return;
      }

      setSuccess(true);
      const m = (data?.mode as "invite" | "email_verify" | undefined) || null;
      setMode(m);

      // Modo INVITE: sin verificación, login automático
      if (m === "invite") {
        const res = await signIn("credentials", {
          email,
          password,
          redirect: false,
          callbackUrl: nextUrl,
        });

        if (res && !res.error) {
          window.location.href = res.url || nextUrl;
          return;
        } else {
          setError(
            "Cuenta creada con invitación, pero no se pudo iniciar sesión automáticamente. Prueba a entrar con tus credenciales."
          );
        }
        return;
      }

      // Modo EMAIL_VERIFY clásico
      if (data?.verifyUrl && process.env.NODE_ENV !== "production") {
        setDevVerifyUrl(data.verifyUrl as string);
      }
    } catch (e: any) {
      setError(e?.message ?? "Error de red.");
    } finally {
      setLoading(false);
    }
  }

  function handleClickLogin() {
    setActiveTab("login");
    setTimeout(() => {
      router.push(`/auth/login?next=${encodeURIComponent(nextUrl)}`);
    }, 120);
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-background via-background to-muted/20 px-3 sm:px-4 py-3 relative overflow-hidden">
      {/* Gradient mesh background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(262,83%,58%,0.15)_0%,transparent_50%),radial-gradient(ellipse_at_bottom_right,hsl(217,91%,60%,0.15)_0%,transparent_50%)]" />

      <Card className="w-full max-w-md relative backdrop-blur-sm bg-card/95 border-border shadow-elegant">
        <CardHeader className="space-y-4 pt-4 pb-2">
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

          {/* Toggle interruptor (aquí activo "Crear cuenta") */}
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
                  onClick={handleClickLogin}
                  className="relative z-10 flex-1 px-4 py-2.5 rounded-full text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Iniciar sesión
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("register")}
                  className="relative z-10 flex-1 px-4 py-2.5 rounded-full text-xs sm:text-sm font-medium text-foreground"
                >
                  Crear cuenta
                </button>
              </div>
            </div>
          </div>

          {/* Título / subtítulo (compactos) */}
          <div className="text-center space-y-1">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">
              Crear cuenta (beta cerrada)
            </h2>
            <p className="text-xs text-muted-foreground">
              Solo con invitación. Introduce tu código para activar la prueba.
            </p>
          </div>
        </CardHeader>

        <CardContent className="pb-4">
          {/* Banner SOLO para modo email_verify */}
          {success && mode === "email_verify" && (
            <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs sm:text-sm text-emerald-800 mb-3">
              Te hemos enviado un correo para <strong>verificar</strong> tu
              cuenta.
              {devVerifyUrl && process.env.NODE_ENV !== "production" && (
                <>
                  {" "}
                  (dev){" "}
                  <a
                    href={devVerifyUrl}
                    className="underline text-emerald-700"
                    target="_blank"
                  >
                    Verificar ahora
                  </a>
                </>
              )}
            </div>
          )}

          {error && !success && (
            <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs sm:text-sm text-red-700 mb-3">
              {error}
            </div>
          )}

          <form className="space-y-3" onSubmit={onSubmit} noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-foreground text-xs" htmlFor="first-name">
                  Nombre
                </Label>
                <Input
                  id="first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  placeholder="Tu nombre"
                  className="bg-background border-border focus:border-primary transition-colors h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground text-xs" htmlFor="last-name">
                  Apellidos
                </Label>
                <Input
                  id="last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  placeholder="Tus apellidos"
                  className="bg-background border-border focus:border-primary transition-colors h-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-foreground text-xs" htmlFor="reg-email">
                Email
              </Label>
              <Input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="cliente@negocio.com"
                className="bg-background border-border focus:border-primary transition-colors h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-foreground text-xs" htmlFor="invite-code">
                Código de invitación
              </Label>
              <Input
                id="invite-code"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                required
                maxLength={6}
                placeholder="000000"
                className="bg-background border-border focus:border-primary transition-colors font-mono tracking-[0.25em] text-center h-9"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-foreground text-xs" htmlFor="reg-password">
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="bg-background border-border focus:border-primary transition-colors pr-10 h-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <span className="text-[10px] font-medium">Ocultar</span>
                    ) : (
                      <span className="text-[10px] font-medium">Ver</span>
                    )}
                  </button>
                </div>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  Mínimo 6 caracteres.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-foreground text-xs" htmlFor="reg-confirm">
                  Confirmar contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="reg-confirm"
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    placeholder="Repite la contraseña"
                    className="bg-background border-border focus:border-primary transition-colors pr-10 h-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirm ? (
                      <span className="text-[10px] font-medium">Ocultar</span>
                    ) : (
                      <span className="text-[10px] font-medium">Ver</span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <label className="flex items-start gap-2 text-[11px] sm:text-xs text-muted-foreground">
              <input
                type="checkbox"
                className="mt-0.5 accent-primary"
                checked={accept}
                onChange={(e) => setAccept(e.target.checked)}
              />
              <span>
                Acepto los{" "}
                <a href="/legal/terms" className="text-primary hover:underline">
                  Términos
                </a>{" "}
                y la{" "}
                <a
                  href="/legal/privacy"
                  className="text-primary hover:underline"
                >
                  Privacidad
                </a>
                .
              </span>
            </label>

            <label className="flex items-center gap-2 text-[11px] sm:text-xs text-muted-foreground">
              <input
                type="checkbox"
                className="accent-primary"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
              />
              Quiero recibir novedades y ofertas (opcional)
            </label>

            <Button
              type="submit"
              disabled={loading || (success && mode === "invite")}
              className="w-full bg-gradient-to-r from-primary via-accent to-[hsl(280,100%,70%)] hover:opacity-90 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-60 h-9 text-sm"
            >
              {loading
                ? "Creando cuenta…"
                : mode === "invite" && success
                ? "Cuenta creada"
                : "Crear cuenta con invitación"}
            </Button>
          </form>

          <div className="mt-3 space-y-1 text-center text-[11px] text-muted-foreground">
            <p>
              ¿Ya tienes cuenta?{" "}
              <Link
                href={`/auth/login?next=${encodeURIComponent(nextUrl)}`}
                className="text-primary hover:underline"
              >
                Inicia sesión
              </Link>
            </p>
            <p>
              ¿Problemas con tu código?{" "}
              <a
                href="mailto:admin@crussader.com"
                className="text-primary hover:underline"
              >
                Soporte
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
