"use client";

import { Star } from "lucide-react";

export type EstablishmentCardProps = {
  id: string;
  title: string;
  city?: string | null;
  reviewsAvg?: number | null;
  reviewsCount?: number;
  selected?: boolean;
  onSelect?: (id: string) => void;
};

export default function EstablishmentCard({
  id,
  title,
  city,
  reviewsAvg,
  reviewsCount,
  selected = false,
  onSelect,
}: EstablishmentCardProps) {
  return (
    <div
      onClick={() => onSelect?.(id)}
      className={`
        flex justify-between items-center p-4 rounded-lg border cursor-pointer
        transition-all bg-background hover:bg-accent
        ${selected ? "border-primary shadow-sm" : "border-border"}
      `}
    >
      {/* Izquierda: nombre y ciudad */}
      <div className="flex flex-col justify-center">
        <span className="font-semibold text-foreground">{title}</span>
        <span className="text-sm text-muted-foreground">{city ?? "—"}</span>
      </div>

      {/* Derecha: rating y reseñas */}
      <div className="flex flex-col items-center justify-center">
        <div className="flex items-center gap-1">
          <span className="font-medium">{reviewsAvg?.toFixed(1) ?? "–"}</span>
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
        </div>
        <span className="text-xs text-muted-foreground">
          {reviewsCount ?? 0} reseñas
        </span>
      </div>
    </div>
  );
}
