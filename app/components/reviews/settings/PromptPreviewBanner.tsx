// app/components/reviews/settings/PromptPreviewBanner.tsx
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
  const [collapsed, setCollapsed] = useState(false);

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
  }, [JSON.stringify(settings), reviewExample]);

  // Barra superior con botón de colapso
  /*return (
    <div className="w-full bg-white">
      <div className="w-full h-10 flex items-center justify-between border-b">
        <div className="text-sm font-medium px-3">Prompt preview</div>
        <div className="px-3">
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="text-xs border rounded px-2 py-1 hover:bg-gray-50"
            aria-expanded={!collapsed}
            aria-controls="prompt-content"
          >
            {collapsed ? "Expandir" : "Colapsar"}
          </button>
        </div>
      </div>

      {/* Contenido colapsable 
      <div
        id="prompt-content"
        className={collapsed ? "hidden" : "block"}
      >
        {error && (
          <div className="border-b bg-red-50 text-red-800 text-sm p-3">
            Error generando preview: {error}
          </div>
        )}

        {!error && loading && (
          <div className="border-b bg-muted/30 text-muted-foreground text-sm p-3">
            Generando vista previa del prompt…
          </div>
        )}

        {!error && !loading && !preview && (
          <div className="border-b bg-muted/20 text-muted-foreground text-sm p-3">
            Ajusta tu configuración para ver el prompt resultante.
          </div>
        )}

        {!error && !loading && preview && (
          <div className="p-4 text-sm font-mono whitespace-pre-wrap text-gray-800">
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
        )}
      </div>
    </div>
  );*/
}
