// app/auth/AuthClient.tsx
"use client";

import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Props = { initialTab: "login" | "register" };

export default function AuthClient({ initialTab }: Props) {
  const [tab, setTab] = useState<"login" | "register">(initialTab);

  // URL params (para post-verify)
  const params = useSearchParams();
  const [nextUrl, setNextUrl] = useState("/dashboard");

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

  // LOGIN state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

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

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    const res = await signIn("credentials", {
      email: loginEmail,
      password: loginPassword,
      callbackUrl: nextUrl, // ⬅️ respeta ?next o /dashboard
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

  const verifiedBanner = params.get("verified") === "1";

  return (
    <div className="min-h-screen bg-[radial-gradient(60%_80%_at_50%_-10%,#a78bfa_0%,transparent_60%),linear-gradient(180deg,#0b0514_0%,#0b0514_35%,#0e0a1a_100%)] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="relative rounded-2xl p-[1px] bg-gradient-to-br from-purple-500/80 via-fuchsia-500/60 to-sky-500/70 shadow-[0_10px_40px_-10px_rgba(79,70,229,0.5)]">
          <div className="rounded-2xl bg-white/10 backdrop-blur-xl p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-3xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-white">
                Bienvenido
              </h2>
              <p className="text-white/70 mt-1">
                {tab === "login" ? "Inicia sesión para continuar" : "Crea tu cuenta para empezar"}
              </p>
            </div>

            {/* Aviso tras verificar */}
            {verifiedBanner && tab === "login" && (
              <div className="mb-4 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                ¡Correo verificado! Ahora introduce tu contraseña para entrar.
              </div>
            )}

            {/* Tabs */}
            <div className="grid grid-cols-2 rounded-xl bg-white/10 p-1 mb-6">
              <button
                onClick={() => setTab("login")}
                className={`py-2 text-sm font-medium rounded-lg transition ${
                  tab === "login" ? "bg-white text-purple-700 shadow" : "text-white/70 hover:text-white"
                }`}
              >
                Iniciar sesión
              </button>
              <button
                onClick={() => setTab("register")}
                className={`py-2 text-sm font-medium rounded-lg transition ${
                  tab === "register" ? "bg-white text-purple-700 shadow" : "text-white/70 hover:text-white"
                }`}
              >
                Crear cuenta
              </button>
            </div>

            {/* Forms */}
            {tab === "login" ? (
              <form className="space-y-4" onSubmit={handleLogin}>
                {loginError && (
                  <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {loginError}
                  </div>
                )}
                <div>
                  <label className="block text-sm text-white/80 mb-1">Email</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full px-3 py-2 rounded-lg bg-white/90 text-gray-900 placeholder-gray-500 outline-none ring-2 ring-transparent focus:ring-purple-400 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-1">Contraseña</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••"
                    className="w-full px-3 py-2 rounded-lg bg-white/90 text-gray-900 placeholder-gray-500 outline-none ring-2 ring-transparent focus:ring-purple-400 transition"
                    required
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="inline-flex items-center gap-2 text-white/80">
                    <input
                      type="checkbox"
                      className="accent-purple-600"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    Recordar sesión
                  </label>
                  <a
                    href="/auth/forgot"
                    className="text-purple-200 hover:text-white underline-offset-4 hover:underline"
                  >
                    Olvidé mi contraseña
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-600 via-fuchsia-600 to-sky-600 text-white font-medium hover:opacity-95 active:opacity-90 transition disabled:opacity-60"
                >
                  {loginLoading ? "Entrando…" : "Iniciar sesión"}
                </button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={handleRegister}>
                {regSuccess ? (
                  <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                    Te hemos enviado un correo para verificar tu cuenta. Revisa tu bandeja.
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

                <div>
                  <label className="block text-sm text-white/80 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre"
                    className="w-full px-3 py-2 rounded-lg bg-white/90 text-gray-900 placeholder-gray-500 outline-none ring-2 ring-transparent focus:ring-purple-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-1">Email</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full px-3 py-2 rounded-lg bg-white/90 text-gray-900 placeholder-gray-500 outline-none ring-2 ring-transparent focus:ring-purple-400 transition"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-white/80 mb-1">Contraseña</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••"
                      className="w-full px-3 py-2 rounded-lg bg-white/90 text-gray-900 placeholder-gray-500 outline-none ring-2 ring-transparent focus:ring-purple-400 transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/80 mb-1">Confirmar</label>
                    <input
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Repite la contraseña"
                      className="w-full px-3 py-2 rounded-lg bg-white/90 text-gray-900 placeholder-gray-500 outline-none ring-2 ring-transparent focus:ring-purple-400 transition"
                      required
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
                    <a href="/legal/terms" className="text-purple-200 hover:text-white underline">
                      Términos y Condiciones
                    </a>{" "}
                    y la{" "}
                    <a href="/legal/privacy" className="text-purple-200 hover:text-white underline">
                      Política de Privacidad
                    </a>
                    .
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={regLoading || regSuccess}
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-600 via-fuchsia-600 to-sky-600 text-white font-medium hover:opacity-95 active:opacity-90 transition disabled:opacity-60"
                >
                  {regLoading ? "Creando cuenta…" : regSuccess ? "Correo enviado" : "Crear cuenta"}
                </button>
              </form>
            )}

            {/* Divider */}
            <div className="flex items-center my-6 gap-3">
              <div className="flex-1 h-px bg-white/20" />
              <span className="text-xs text-white/60">O CONTINÚA CON</span>
              <div className="flex-1 h-px bg-white/20" />
            </div>

            {/* Social */}
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                className="w-full flex items-center justify-center gap-3 rounded-lg bg-white text-gray-900 py-2 hover:bg-white/90 transition"
              >
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google"
                  className="w-5 h-5"
                />
                <span className="font-medium">
                  {tab === "login" ? "Entrar con Google" : "Crear cuenta con Google"}
                </span>
              </button>

              <button
                onClick={() => {
                  /* TODO: signIn("facebook", { callbackUrl: "/dashboard" }) */
                }}
                className="w-full flex items-center justify-center gap-3 rounded-lg bg-[#1877F2] py-2 hover:brightness-110 transition"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                  <path d="M22 12.06C22 6.48 17.52 2 11.94 2S2 6.48 2 12.06c0 4.99 3.66 9.13 8.44 9.94v-7.03H7.9V12.06h2.54V9.86c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.86h2.78l-.44 2.91h-2.34V22c4.78-.81 8.44-4.95 8.44-9.94Z" />
                </svg>
                <span className="font-medium text-white">
                  {tab === "login" ? "Entrar con Facebook" : "Crear cuenta con Facebook"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer mini */}
        <p className="text-center text-xs text-white/60 mt-4">
          ¿Problemas para entrar?{" "}
          <a href="/support" className="underline hover:text-white">
            Soporte
          </a>
        </p>
      </div>
    </div>
  );
}
