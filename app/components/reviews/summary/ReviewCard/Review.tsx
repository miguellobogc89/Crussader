"use client";

import Image from "next/image";
import { Star } from "lucide-react";

type Props = {
  author: string;
  content: string;
  rating: number;
  dateISO: string;
  avatarUrl?: string;
};

function timeAgoEs(iso: string) {
  const dt = new Date(iso);
  if (isNaN(dt.getTime())) return "";
  const now = new Date();
  const d = Math.floor((now.getTime() - dt.getTime()) / 86400000);
  if (d <= 0) return "Hace unas horas";
  if (d === 1) return "Hace 1 día";
  if (d < 7) return `Hace ${d} días`;
  const w = Math.floor(d / 7);
  if (w === 1) return "Hace 1 semana";
  if (w <= 3) return `Hace ${w} semanas`;
  return "Hace 1 mes";
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

export default function Review({ author, content, rating, dateISO, avatarUrl }: Props) {
  const when = timeAgoEs(dateISO);
  const initial = (author || "?").charAt(0).toUpperCase();

  return (
    <div
      className="
        p-2
        max-w-[520px] w-full
      "
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

        {/* Nombre y fecha */}
        <div className="flex-1 min-w-0">
          <div
            className="font-semibold text-neutral-900 truncate"
            style={{ fontSize: "clamp(14px,1.3vw,16px)" }}
          >
            {author}
          </div>
          <div
            className="text-neutral-500"
            style={{ fontSize: "clamp(11px,0.8vw,13px)" }}
          >
            {when}
          </div>
        </div>
      </div>

      {/* Estrellas: ahora están debajo del header */}
      <div className="mt-[clamp(6px,1vw,10px)]">
        <Stars value={rating} />
      </div>

      {/* Texto de la reseña */}
      <p
        className="mt-[clamp(10px,1.8vw,6px)] text-neutral-900 whitespace-pre-wrap"
        style={{
          fontSize: "clamp(14px,1.0vw,15px)",
          lineHeight: "clamp(20px,2.2vw,24px)",
        }}
      >
        {content}
      </p>
    </div>
  );
}
