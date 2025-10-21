// app/auth/forgot/ForgotClient.tsx
"use client";

import Link from "next/link";
import { useState } from "react";

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
                Recuperar contraseña
              </h2>
              <p className="text-white/70 mt-1">Te enviaremos un enlace para restablecerla.</p>
            </div>

            {sent ? (
              <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 mb-4">
                Si el correo existe, te hemos enviado un enlace para restablecer tu contraseña.
                {devResetUrl && process.env.NODE_ENV !== "production" && (
                  <> (dev) <a className="underline text-emerald-700" href={devResetUrl} target="_blank">Restablecer ahora</a></>
                )}
              </div>
            ) : error ? (
              <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 mb-4">
                {error}
              </div>
            ) : null}

            {!sent && (
              <form className="space-y-4" onSubmit={onSubmit} noValidate>
                <div>
                  <label className="block text-sm text-white/80 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full px-3 py-2 rounded-lg bg-white/90 text-gray-900 outline-none ring-2 ring-transparent focus:ring-purple-400 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-600 via-fuchsia-600 to-sky-600 text-white font-medium hover:opacity-95 active:opacity-90 transition disabled:opacity-60"
                >
                  {loading ? "Enviando…" : "Enviar enlace"}
                </button>
              </form>
            )}

            <div className="mt-6 text-center text-sm text-white/70">
              <Link href="/auth/login" className="underline hover:text-white">Volver a iniciar sesión</Link>
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
