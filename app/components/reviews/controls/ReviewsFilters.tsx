// app/components/reviews/ReviewsFilters.tsx
"use client";

import { useEffect, useState } from "react";
import { Star, MessageCircleOff, Image as ImageIcon } from "lucide-react";

export type ReviewsFiltersValue = {
  stars: number[];          // p.ej. [5,4]
  unanswered: boolean;      // solo sin responder
  withPhotos: boolean;      // solo con foto
};

export type ReviewsFiltersProps = {
  className?: string;
  /** Valores iniciales opcionales */
  defaultValue?: Partial<ReviewsFiltersValue>;
  /** Callback cada vez que cambie cualquier filtro */
  onChange?: (value: ReviewsFiltersValue) => void;
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

export default function ReviewsFilters({
  className,
  defaultValue,
  onChange,
}: ReviewsFiltersProps) {
  const [selectedStars, setSelectedStars] = useState<Set<number>>(
    new Set(defaultValue?.stars ?? [])
  );
  const [unanswered, setUnanswered] = useState<boolean>(!!defaultValue?.unanswered);
  const [withPhotos, setWithPhotos] = useState<boolean>(!!defaultValue?.withPhotos);

  const toggleStar = (n: number) => {
    setSelectedStars((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  };

  // Notifica cambios al padre (si se proporciona onChange)
  useEffect(() => {
    onChange?.({
      stars: Array.from(selectedStars).sort((a, b) => a - b),
      unanswered,
      withPhotos,
    });
  }, [selectedStars, unanswered, withPhotos, onChange]);

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => {
          const active = selectedStars.has(n);
          return (
            <IconToggle key={n} active={active} onClick={() => toggleStar(n)} label={String(n)}>
              <Star size={16} className={active ? "text-amber-600" : "text-muted-foreground"} />
            </IconToggle>
          );
        })}

        <IconToggle active={unanswered} onClick={() => setUnanswered((v) => !v)} label="Sin responder">
          <MessageCircleOff
            size={16}
            className={unanswered ? "text-emerald-600" : "text-muted-foreground"}
          />
        </IconToggle>

        <IconToggle active={withPhotos} onClick={() => setWithPhotos((v) => !v)} label="Con foto">
          <ImageIcon
            size={16}
            className={withPhotos ? "text-rose-700" : "text-muted-foreground"}
          />
        </IconToggle>
      </div>
    </div>
  );
}
