"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  reviewId: string;
  label?: string;
  className?: string;
};

export default function GenerateReviewResponseButton({
  reviewId,
  label = "Generar respuesta IA",
  className = "",
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Si quisieras pasar opciones:
        // body: JSON.stringify({ language: "es", tone: "cordial" })
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "No se pudo generar la respuesta");
      }

      setMsg("Generada ✔");
      // Fuerza refresco de los datos del server (App Router)
      router.refresh();
    } catch (e: any) {
      setMsg(`Error: ${String(e.message || e)}`);
    } finally {
      setLoading(false);
      // Limpia el mensaje tras unos segundos (opcional)
      setTimeout(() => setMsg(null), 2500);
    }
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="px-3 py-1.5 rounded-md bg-black text-white hover:opacity-90 disabled:opacity-50"
        aria-busy={loading}
        aria-label={label}
        title={label}
      >
        {loading ? "Generando..." : label}
      </button>
      {msg && <span className="text-sm">{msg}</span>}
    </div>
  );
}
