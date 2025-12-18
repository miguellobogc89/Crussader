// app/components/reviews/summary/ReviewCard/Review.tsx
"use client";

import Image from "next/image";
import { Star } from "lucide-react";
import type { CSSProperties } from "react";

type Props = {
  author: string;
  content: string;
  rating: number;
  dateISO: string;
  avatarUrl?: string;
  maxLines?: number; // 👉 opcional, no rompe nada si no se usa
};

function timeAgoEs(iso: string) {
  const dt = new Date(iso);
  if (isNaN(dt.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - dt.getTime();

  // Si viene una fecha futura o igual (por desfase / timezone), lo suavizamos.
  if (diffMs <= 0) return "Hace unas horas";

  const d = Math.floor(diffMs / 86400000);
  if (d <= 0) return "Hace unas horas";
  if (d === 1) return "Hace 1 día";
  if (d < 7) return `Hace ${d} días`;

  const w = Math.floor(d / 7);
  if (w === 1) return "Hace 1 semana";
  if (w < 5) return `Hace ${w} semanas`;

  const m = Math.floor(d / 30);
  if (m <= 1) return "Hace 1 mes";
  if (m < 12) return `Hace ${m} meses`;

  const y = Math.floor(d / 365);
  if (y <= 1) return "Hace 1 año";
  return `Hace ${y} años`;
}


function Stars({ value }: { value: number }) {
  const size = "clamp(16px, 1.6vw, 20px)";
  return (
    <div className="flex gap-[clamp(4px,0.5vw,6px)]">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        return (
          <Star
            key={n}
            style={{ width: size, height: size }}
            className={filled ? "text-yellow-400 fill-yellow-400" : "text-neutral-300"}
          />
        );
      })}
    </div>
  );
}

export default function Review({ author, content, rating, dateISO, avatarUrl, maxLines }: Props) {
  const when = timeAgoEs(dateISO);
  const initial = (author || "?").charAt(0).toUpperCase();

  const baseTextStyle: CSSProperties = {
    fontSize: "clamp(14px,1.0vw,15px)",
    lineHeight: "clamp(20px,2.2vw,24px)",
    letterSpacing: "0.005em",
  };

  const textStyle: CSSProperties = maxLines
    ? {
        ...baseTextStyle,
        display: "-webkit-box",
        WebkitLineClamp: maxLines,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }
    : baseTextStyle;
console.log("[ReviewCard] dateISO:", dateISO, "->", new Date(dateISO).toISOString());

  return (
    <div
      className="p-2 max-w-[520px] w-full text-neutral-900 subpixel-antialiased"
      style={{
        fontFamily:
          '"Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
        fontWeight: 400,
      }}
    >
      {/* Cabecera: avatar + nombre + fecha */}
      <div className="flex items-start gap-[clamp(10px,1.8vw,14px)]">
        {/* Avatar */}
        <div
          className="relative overflow-hidden rounded-full flex-shrink-0"
          style={{
            width: "clamp(36px, 4.5vw, 44px)",
            height: "clamp(36px, 4.5vw, 44px)",
          }}
        >
          {avatarUrl ? (
            <Image src={avatarUrl} alt={author} fill sizes="44px" className="object-cover" />
          ) : (
            <div className="h-full w-full rounded-full bg-gradient-to-br from-indigo-400 to-fuchsia-500 flex items-center justify-center">
              <span
                style={{ fontSize: "clamp(14px,1.4vw,16px)" }}
                className="font-semibold text-white leading-none"
              >
                {initial}
              </span>
            </div>
          )}
        </div>

        {/* Nombre, estrellas y fecha */}
        <div className="flex-1 min-w-0">
          <div
            className="font-semibold text-neutral-900 truncate"
            style={{ fontSize: "clamp(14px,1.3vw,16px)" }}
          >
            {author}
          </div>

          <div className="flex items-center gap-2 mt-[clamp(4px,0.8vw,6px)]">
            <Stars value={rating} />
            <span
              className="text-neutral-500"
              style={{ fontSize: "clamp(11px,0.8vw,13px)" }}
            >
              {when}
            </span>
          </div>
        </div>
      </div>

      {/* Texto de la reseña */}
      <p
        className="mt-[clamp(10px,1.8vw,6px)] text-neutral-900 whitespace-pre-wrap"
        style={textStyle}
      >
        {content}
      </p>
    </div>
  );
}
