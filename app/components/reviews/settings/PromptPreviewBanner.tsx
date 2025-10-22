"use client";

import { useEffect, useState } from "react";

type Props = {
  settings: Record<string, any>; // settings actuales (de los sliders/campos)
  reviewExample?: string;        // texto ejemplo opcional, por defecto uno genérico
};

export default function PromptPreviewBanner({ settings, reviewExample }: Props) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{ system: string; user: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!settings) return;
    const controller = new AbortController();
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/responses/preview", {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            settings,
            review: {
              content:
                reviewExample ??
                "Excelente servicio y atención, sin duda volveré pronto.",
              rating: 5,
              author: "Cliente de ejemplo",
            },
          }),
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || "preview_failed");
        setPreview({ system: json.system, user: json.user });
      } catch (e: any) {
        if (e.name === "AbortError") return;
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [JSON.stringify(settings)]);

  if (error)
    return (
      <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
        Error generando preview: {error}
      </div>
    );

  if (loading)
    return (
      <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
        Generando vista previa del prompt…
      </div>
    );

  if (!preview)
    return (
      <div className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
        Ajusta tu configuración para ver el prompt resultante.
      </div>
    );

  return (
    <div className="rounded-lg border bg-gray-50 p-4 text-sm font-mono whitespace-pre-wrap text-gray-800 shadow-sm">
      <div className="text-xs font-semibold uppercase text-gray-500 mb-2">
        System prompt:
      </div>
      <pre className="mb-4 overflow-x-auto whitespace-pre-wrap break-words text-gray-700">
        {preview.system}
      </pre>

      <div className="text-xs font-semibold uppercase text-gray-500 mb-2">
        User prompt:
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap break-words text-gray-700">
        {preview.user}
      </pre>
    </div>
  );
}
