// app/components/reviews/sentiment/HighlightsCardsRow.tsx
"use client";

import * as React from "react";
import { motion } from "framer-motion";

type EnrichedTag = {
  label: string;
  mentions: number;
  icon: string;
  copy: string;
};

export type HighlightsEnriched = {
  success: EnrichedTag[];
  improve: EnrichedTag[];
  attention: EnrichedTag[];
};

type Tone = "success" | "improve" | "attention";

function Block({
  title,
  subtitle,
  items,
  titleIcon,
  delay = 0,
  tone,
}: {
  title: string;
  subtitle: string;
  items: EnrichedTag[];
  titleIcon: string;
  delay?: number;
  tone: Tone;
}) {
  const cardClass =
    tone === "success"
      ? "rounded-3xl border border-emerald-200 bg-gradient-to-b from-emerald-50/80 via-white to-white shadow-sm"
      : tone === "improve"
      ? "rounded-3xl border border-sky-200 bg-gradient-to-b from-sky-50/80 via-white to-white shadow-sm"
      : "rounded-3xl border border-rose-200 bg-gradient-to-b from-rose-50/80 via-white to-white shadow-sm";

  const factBorderClass =
    tone === "success"
      ? "border-emerald-300"
      : tone === "improve"
      ? "border-sky-300"
      : "border-rose-300";

  const factTitleClass =
    tone === "success"
      ? "text-emerald-700"
      : tone === "improve"
      ? "text-sky-700"
      : "text-rose-700";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay }}
      className={cardClass}
    >
      <div className="p-4 sm:p-5 xl:p-6 xl2:p-7">
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <div className="flex min-w-0 items-start gap-2 sm:gap-3">
            <div className="mt-0.5 shrink-0 rounded-2xl bg-white p-2 ring-1 ring-slate-400">
              <span className="block text-[16px] leading-none sm:text-[18px] xl:text-[18px] xl2:text-[20px]">
                {titleIcon}
              </span>
            </div>

            <div className="min-w-0">
              <h3 className="truncate text-[13px] font-semibold text-slate-900 sm:text-sm xl:text-[13px] xl2:text-sm">
                {title}
              </h3>
              <p className="mt-1 text-[11px] text-slate-500 sm:text-xs xl:text-[11px] xl2:text-xs">
                {subtitle}
              </p>
            </div>
          </div>

          <div className="shrink-0 rounded-2xl bg-white px-2.5 py-1.5 text-[10px] font-medium text-slate-600 ring-1 ring-slate-200 sm:px-3 sm:py-2 sm:text-[11px] xl:text-[10px] xl2:text-[11px]">
            Top {Math.min(5, items.length)}
          </div>
        </div>

        <div className="mt-3 space-y-3 sm:mt-4 sm:space-y-3.5 xl:space-y-3 xl2:space-y-4">
          {items.slice(0, 5).map((t) => (
            <div
              key={t.label}
                className={`rounded-3xl border border-solid bg-white p-3 sm:p-4 xl:p-3.5 xl2:p-4.5 ${factBorderClass}`}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div
                    className={`text-[13px] font-semibold sm:text-sm xl:text-[13px] xl2:text-sm ${factTitleClass}`}
                  >
                    {t.label}
                  </div>

                  <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600 sm:text-[11px] xl:text-[10px] xl2:text-[11px]">
                    {t.mentions} menciones
                  </div>
                </div>

                <p className="mt-1 text-[12px] leading-5 text-slate-700 sm:text-sm xl:text-[12px] xl2:text-sm">
                  {t.copy}
                </p>
              </div>
            </div>
          ))}

          {items.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-3 text-[12px] text-slate-600 sm:p-4 sm:text-sm xl:text-[12px] xl2:text-sm">
              No hay suficientes menciones en este rango.
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

export default function HighlightsCardsRow({
  data,
}: {
  data: HighlightsEnriched;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 xl:gap-4 xl2:gap-5">
      <Block
        title="Dónde tenemos éxito"
        subtitle="Lo que más valoran tus clientes"
        items={data.success}
        titleIcon="🎉"
        tone="success"
        delay={0}
      />
      <Block
        title="Podemos mejorar"
        subtitle="Oportunidades detectadas en reseñas"
        items={data.improve}
        titleIcon="🛠️"
        tone="improve"
        delay={0.08}
      />
      <Block
        title="Especial atención"
        subtitle="Señales a vigilar de cerca"
        items={data.attention}
        titleIcon="👀"
        tone="attention"
        delay={0.16}
      />
    </div>
  );
}
