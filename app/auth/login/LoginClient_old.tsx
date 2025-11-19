// app/auth/login/LoginClient.tsx
"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginClient() {
  const params = useSearchParams();
  const nextUrl = params.get("next") || "/dashboard";

  const [email, setEmail] = useState(params.get("email") || "");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const verifiedBanner = params.get("verified") === "1";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", {
      email, password, callbackUrl: nextUrl, redirect: false,
    });
    setLoading(false);

    if (!res) return setError("Error desconocido.");
    if (res.error) {
      const map: Record<string, string> = {
        BAD_CREDENTIALS: "Email o contraseña incorrectos.",
        EMAIL_NOT_VERIFIED: "Verifica tu correo antes de entrar.",
        ACCOUNT_SUSPENDED: "Cuenta suspendida.",
        ACCOUNT_INACTIVE:  "Cuenta inactiva.",
        MISSING_CREDENTIALS: "Faltan credenciales.",
      };
      return setError(map[res.error] ?? res.error);
    }
    window.location.href = res.url ?? "/dashboard";
  }

  useEffect(() => {
    // Puedes enviar 'remember' a un endpoint si quieres cambiar maxAge dinámicamente
  }, [remember]);

  return (
    <div className="min-h-screen bg-[radial-gradient(60%_80%_at_50%_-10%,#a78bfa_0%,transparent_60%),linear-gradient(180deg,#0b0514_0%,#0b0514_35%,#0e0a1a_100%)] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-4 text-center">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-violet-300 to-fuchsia-200 bg-clip-text text-transparent">
            Crussader
          </Link>
        </div>

        <div className="relative rounded-2xl p-[1px] bg-gradient-to-br from-purple-500/80 via-fuchsia-500/60 to-sky-500/70 shadow-[0_10px_40px_-10px_rgba(79,70,229,0.5)]">
          <div className="rounded-2xl bg-white/10 backdrop-blur-xl p-8">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-white">
                Iniciar sesión
              </h2>
              <p className="text-white/70 mt-1">Introduce tus credenciales</p>
            </div>

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
              <div>
                <label className="block text-sm text-white/80 mb-1">Email</label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com" required
                  className="w-full px-3 py-2 rounded-lg bg-white/90 text-gray-900 outline-none ring-2 ring-transparent focus:ring-purple-400 transition"
                />
              </div>
              <div>
                <label className="block text-sm text-white/80 mb-1">Contraseña</label>
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••" required
                  className="w-full px-3 py-2 rounded-lg bg-white/90 text-gray-900 outline-none ring-2 ring-transparent focus:ring-purple-400 transition"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="inline-flex items-center gap-2 text-white/80">
                  <input type="checkbox" className="accent-purple-600"
                    checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                  Recordar sesión
                </label>
                <a href="/auth/forgot" className="text-purple-200 hover:text-white underline-offset-4 hover:underline">
                  Olvidé mi contraseña
                </a>
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-600 via-fuchsia-600 to-sky-600 text-white hover:opacity-95 active:opacity-90 transition disabled:opacity-60"
              >
                {loading ? "Entrando…" : "Iniciar sesión"}
              </button>
            </form>

            <div className="flex items-center my-6 gap-3">
              <div className="flex-1 h-px bg-white/20" />
              <span className="text-xs text-white/60">O CONTINÚA CON</span>
              <div className="flex-1 h-px bg-white/20" />
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => signIn("google", { callbackUrl: nextUrl })}
                className="w-full flex items-center justify-center gap-3 rounded-lg bg-white text-gray-900 py-2 hover:bg-white/90 transition"
              >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                <span className="font-medium">Entrar con Google</span>
              </button>
            </div>

            <div className="mt-6 text-center text-sm text-white/70">
              ¿No tienes cuenta?{" "}
              <Link href={`/auth/register?next=${encodeURIComponent(nextUrl)}`} className="underline hover:text-white">
                Crea una cuenta
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-white/60 mt-4">
          ¿Problemas? <a href="/support" className="underline hover:text-white">Soporte</a>
        </p>
      </div>
    </div>
  );
}
