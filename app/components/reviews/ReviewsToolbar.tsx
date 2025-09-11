// app/components/reviews/ReviewsToolbar.tsx
"use client";

import { useState } from "react";
import { Star, MessageCircleOff, Image as ImageIcon, ArrowUpDown, Check } from "lucide-react";

export type ReviewsToolbarProps = {
  className?: string;
};

function IconToggle({
  active,
  onClick,
  children,
  label,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-1 rounded-md border px-2 py-1 text-sm ${
        active ? "bg-muted/30" : "bg-white"
      }`}
    >
      {children}
      {label ? <span className="select-none">{label}</span> : null}
    </button>
  );
}

export default function ReviewsToolbar({ className }: ReviewsToolbarProps) {
  const [selectedStars, setSelectedStars] = useState<Set<number>>(new Set());
  const [filterUnanswered, setFilterUnanswered] = useState(false);
  const [filterWithPhotos, setFilterWithPhotos] = useState(false);
  const [search, setSearch] = useState("");

  // 🔽 ordenar
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderBy, setOrderBy] = useState<"recent" | "oldest" | "highest" | "lowest">("recent");

  const toggleStar = (n: number) => {
    setSelectedStars((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  };

  const handleOrder = (val: "recent" | "oldest" | "highest" | "lowest") => {
    setOrderBy(val);
    setOrderOpen(false);
  };

  return (
    <div className={className}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* (izquierda) filtros */}
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => {
            const active = selectedStars.has(n);
            return (
              <IconToggle key={n} active={active} onClick={() => toggleStar(n)} label={String(n)}>
                <Star size={16} className={active ? "text-amber-600" : "text-muted-foreground"} />
              </IconToggle>
            );
          })}

          <IconToggle
            active={filterUnanswered}
            onClick={() => setFilterUnanswered((v) => !v)}
            label="Sin responder"
          >
            <MessageCircleOff
              size={16}
              className={filterUnanswered ? "text-emerald-600" : "text-muted-foreground"}
            />
          </IconToggle>

          <IconToggle
            active={filterWithPhotos}
            onClick={() => setFilterWithPhotos((v) => !v)}
            label="Con foto"
          >
            <ImageIcon
              size={16}
              className={filterWithPhotos ? "text-rose-700" : "text-muted-foreground"}
            />
          </IconToggle>
        </div>

        {/* (derecha) búsqueda + ordenar */}
        <div className="flex items-center gap-2 relative">
          <input
            type="text"
            placeholder="Buscar por texto, autor…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 rounded-md border bg-white px-3 py-2 text-sm outline-none"
          />

          {/* botón de ordenar */}
          <button
            type="button"
            onClick={() => setOrderOpen((v) => !v)}
            className="flex items-center gap-1 rounded-md border px-2 py-2 text-sm bg-white"
          >
            <ArrowUpDown size={16} />
            <span>Ordenar</span>
          </button>

          {orderOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-md border bg-white shadow-lg z-10">
              <ul className="py-1 text-sm">
                <li>
                  <button
                    onClick={() => handleOrder("recent")}
                    className="flex w-full items-center gap-2 px-3 py-2 hover:bg-muted/30"
                  >
                    {orderBy === "recent" ? <Check size={14} /> : <span className="w-4" />}
                    Más recientes
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleOrder("oldest")}
                    className="flex w-full items-center gap-2 px-3 py-2 hover:bg-muted/30"
                  >
                    {orderBy === "oldest" ? <Check size={14} /> : <span className="w-4" />}
                    Más antiguos
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleOrder("highest")}
                    className="flex w-full items-center gap-2 px-3 py-2 hover:bg-muted/30"
                  >
                    {orderBy === "highest" ? <Check size={14} /> : <span className="w-4" />}
                    Más valoraciones
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleOrder("lowest")}
                    className="flex w-full items-center gap-2 px-3 py-2 hover:bg-muted/30"
                  >
                    {orderBy === "lowest" ? <Check size={14} /> : <span className="w-4" />}
                    Menos valoraciones
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
