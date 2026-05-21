"use client";

import { useState } from "react";

type Props = {
  reviewId: string;
  label?: string;
  className?: string;
  onGenerated?: (response: {
    id: string;
    content: string;
    status: string;
    published: boolean;
    createdAt: string | Date;
    edited?: boolean;
  }) => void;
};

export default function GenerateReviewResponseButton({
  reviewId,
  label = "Generar respuesta IA",
  className = "",
  onGenerated,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          tone: "cordial",
          lang: "es",
          templateId: "default-v1",
        }),
        cache: "no-store",
      });

      const data = await res.json();
      if (!res.ok || !data?.ok || !data?.response) {
        throw new Error(data?.error || "No se pudo generar la respuesta");
      }

      setMsg("Generada ✔");
      onGenerated?.(data.response);
    } catch (e: any) {
      setMsg(`Error: ${String(e.message || e)}`);
    } finally {
      setLoading(false);
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
