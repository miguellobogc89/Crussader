// app/components/reviews/settingsRsections/ResponsePreview.tsx
"use client";

import { useMemo, useState } from "react";
import { Star, Sparkles } from "lucide-react";
import PromptPreviewBanner from "@/app/components/reviews/settings/PromptPreviewBanner";

type StarPick = 1 | 3 | 5;

type Props = {
  /** Estado local de settings que se va actualizando con los sliders/toggles del panel */
  settings: Record<string, any>;
};

export default function ResponsePreview({ settings }: Props) {
  const [stars, setStars] = useState<StarPick>(5);

  const reviewText = useMemo(() => {
    if (stars <= 1)
      return "La experiencia no fue buena. El helado estaba derretido y la espera fue larga.";
    if (stars === 3)
      return "Estuvo bien en general, aunque el servicio podría ser un poco más rápido.";
    return "¡Los helados son increíbles! El de pistacho es mi favorito. El servicio fue excelente y el lugar está muy limpio.";
  }, [stars]);

  return (
    <div className="max-w-5xl mx-auto">
      {/* BANNER: Vista previa del prompt en tiempo real (antes de guardar) */}
      <div className="mb-6 rounded-xl border overflow-hidden">
        <PromptPreviewBanner settings={settings} reviewExample={reviewText} />
      </div>

      {/* Grid alineada */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* IZQ: Review */}
        <div className="flex flex-col h-full">
          <div className="rounded-xl border bg-white shadow-sm p-4 sm:p-5 flex flex-col h-full justify-between">
            <div>
              <div className="mb-2 text-[11px] font-semibold tracking-wide text-muted-foreground">
                REVIEW DE EJEMPLO
              </div>

              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white font-semibold">
                  M
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm sm:text-base text-foreground">
                    María García
                  </div>
                  <div className="text-[11px] sm:text-xs text-muted-foreground">
                    Hace 2 días
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={i < stars ? "text-yellow-400 fill-yellow-400" : "text-zinc-300"}
                  />
                ))}
              </div>

              <p className="mt-3 text-[13px] sm:text-sm leading-relaxed text-foreground/90">
                {reviewText}
              </p>
            </div>

            {/* Selector */}
            <div className="mt-4 flex items-center justify-start gap-2">
              <label
                htmlFor="star-pick"
                className="text-xs text-muted-foreground whitespace-nowrap"
              >
                Valoración:
              </label>
              <select
                id="star-pick"
                value={stars}
                onChange={(e) => setStars(Number(e.target.value) as StarPick)}
                className="h-8 rounded-md border px-2 text-sm bg-white"
              >
                <option value={1}>1 estrella</option>
                <option value={3}>3 estrellas</option>
                <option value={5}>5 estrellas</option>
              </select>
            </div>
          </div>
        </div>

        {/* DER: Respuesta IA */}
        <div className="flex flex-col h-full">
          <div className="rounded-xl border border-violet-300/70 bg-violet-50/40 p-4 sm:p-5 shadow-[0_0_0_3px_rgba(124,58,237,0.06)] flex flex-col h-full justify-between">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <div className="text-xs font-semibold tracking-wide text-muted-foreground">
                  RESPUESTA GENERADA
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] text-foreground/80">
                  <Sparkles className="h-3.5 w-3.5" />
                  IA
                </span>
              </div>

              <p className="text-[13px] sm:text-sm leading-7 text-foreground/90">
                <span className="font-medium">¡Muchas gracias María por tu reseña!</span>{" "}
                {stars >= 5 ? "😊" : stars === 3 ? "🙂" : "🙏"}{" "}
                {stars >= 5
                  ? "Nos alegra enormemente saber que disfrutaste nuestros helados, especialmente el de pistacho. Tu satisfacción es nuestra mayor recompensa."
                  : stars === 3
                  ? "Nos alegra saber que tu visita fue buena, y tomamos nota para mejorar el servicio."
                  : "Lamentamos que esta vez no hayamos estado a la altura; lo sentimos y queremos solucionarlo. Tu satisfacción es nuestra prioridad."}
              </p>

              <p className="mt-4 text-[13px] sm:text-sm text-foreground/80">
                — Equipo Heladería Brumazul
              </p>
            </div>

            {/* Botón */}
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                className="text-xs font-medium rounded-full px-3 py-2 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white hover:opacity-90"
              >
                Generar respuesta
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
