// app/auth/register/RegisterClient.tsx
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";

export default function RegisterClient() {
  const sp = useSearchParams();
  const nextUrl = (sp.get("next") as string) || "/dashboard";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [inviteCode, setInviteCode] = useState(
    (sp.get("code") || "").toUpperCase()
  );
  const [accept, setAccept] = useState(false);
  const [marketing, setMarketing] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [devVerifyUrl, setDevVerifyUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<"invite" | "email_verify" | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!firstName.trim()) return setError("El nombre es obligatorio.");
    if (!lastName.trim()) return setError("Los apellidos son obligatorios.");
    if (!accept) return setError("Debes aceptar los Términos y la Privacidad.");
    if (!email || !password)
      return setError("Email y contraseña son obligatorios.");
    if (password.length < 6)
      return setError("La contraseña debe tener al menos 6 caracteres.");
    if (password !== confirm)
      return setError("Las contraseñas no coinciden.");
    if (!inviteCode.trim())
      return setError(
        "El código de invitación es obligatorio para acceder a la beta."
      );

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

      const data = await r.json().catch(() => ({}));

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

      // Éxito
      setSuccess(true);
      const m = (data?.mode as "invite" | "email_verify" | undefined) || null;
      setMode(m);

      // 🔹 Modo INVITE: sin verificación, login automático
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

      // 🔹 Modo EMAIL_VERIFY clásico
      if (data?.verifyUrl && process.env.NODE_ENV !== "production") {
        setDevVerifyUrl(data.verifyUrl as string);
      }
    } catch (e: any) {
      setError(e?.message ?? "Error de red.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(60%_80%_at_50%_-10%,#a78bfa_0%,transparent_60%),linear-gradient(180deg,#0b0514_0%,#0b0514_35%,#0e0a1a_100%)] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-4 text-center">
          <Link
            href="/"
            className="text-xl font-bold bg-gradient-to-r from-violet-300 to-fuchsia-200 bg-clip-text text-transparent"
          >
            Crussader
          </Link>
        </div>

        <div className="relative rounded-2xl p-[1px] bg-gradient-to-br from-purple-500/80 via-fuchsia-500/60 to-sky-500/70 shadow-[0_10px_40px_-10px_rgba(79,70,229,0.5)]">
          <div className="rounded-2xl bg-white/10 backdrop-blur-xl p-8">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-white">
                Crear cuenta (beta cerrada)
              </h2>
              <p className="text-white/70 mt-1">
                Solo con invitación. Introduce tu código para activar la prueba.
              </p>
            </div>

            {/* Banner SOLO para modo email_verify */}
            {success && mode === "email_verify" && (
              <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 mb-4">
                Te hemos enviado un correo para <strong>verificar</strong> tu
                cuenta.
                {devVerifyUrl &&
                  process.env.NODE_ENV !== "production" && (
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
              <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 mb-4">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={onSubmit} noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-white/80 mb-1">
                    Nombre
                  </label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    placeholder="Tu nombre"
                    className="w-full px-3 py-2 rounded-lg bg-white/90 text-gray-900 outline-none ring-2 ring-transparent focus:ring-purple-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-1">
                    Apellidos
                  </label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    placeholder="Tus apellidos"
                    className="w-full px-3 py-2 rounded-lg bg-white/90 text-gray-900 outline-none ring-2 ring-transparent focus:ring-purple-400 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/80 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="cliente@negocio.com"
                  className="w-full px-3 py-2 rounded-lg bg-white/90 text-gray-900 outline-none ring-2 ring-transparent focus:ring-purple-400 transition"
                />
              </div>

              <div>
                <label className="block text-sm text-white/80 mb-1">
                  Código de invitación
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) =>
                    setInviteCode(e.target.value.toUpperCase())
                  }
                  required
                  maxLength={6}
                  placeholder="000000"
                  className="w-full px-3 py-2 rounded-lg bg-white/90 text-gray-900 outline-none ring-2 ring-transparent focus:ring-purple-400 transition font-mono tracking-[0.25em]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-white/80 mb-1">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••"
                    className="w-full px-3 py-2 rounded-lg bg-white/90 text-gray-900 outline-none ring-2 ring-transparent focus:ring-purple-400 transition"
                  />
                  <p className="mt-1 text-xs text-white/60">
                    Mínimo 6 caracteres.
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-1">
                    Confirmar
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    placeholder="Repite la contraseña"
                    className="w-full px-3 py-2 rounded-lg bg-white/90 text-gray-900 outline-none ring-2 ring-transparent focus:ring-purple-400 transition"
                  />
                </div>
              </div>

              <label className="flex items-start gap-3 text-sm text-white/80">
                <input
                  type="checkbox"
                  className="mt-1 accent-purple-600"
                  checked={accept}
                  onChange={(e) => setAccept(e.target.checked)}
                />
                <span>
                  Acepto los{" "}
                  <a
                    href="/legal/terms"
                    className="text-purple-200 underline"
                  >
                    Términos
                  </a>{" "}
                  y la{" "}
                  <a
                    href="/legal/privacy"
                    className="text-purple-200 underline"
                  >
                    Privacidad
                  </a>
                  .
                </span>
              </label>

              <label className="flex items-center gap-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  className="accent-purple-600"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                />
                Quiero recibir novedades y ofertas (opcional)
              </label>

              <button
                type="submit"
                disabled={loading || (success && mode === "invite")}
                className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-600 via-fuchsia-600 to-sky-600 text-white hover:opacity-95 active:opacity-90 transition disabled:opacity-60"
              >
                {loading
                  ? "Creando cuenta…"
                  : mode === "invite" && success
                  ? "Cuenta creada"
                  : "Crear cuenta con invitación"}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-white/70">
              ¿Ya tienes cuenta?{" "}
              <Link
                href={`/auth/login?next=${encodeURIComponent(nextUrl)}`}
                className="underline hover:text-white"
              >
                Inicia sesión
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-white/60 mt-4">
          ¿Problemas con tu código?{" "}
          <a
            href="mailto:admin@crussader.com"
            className="underline hover:text-white"
          >
            Soporte
          </a>
        </p>
      </div>
    </div>
  );
}
