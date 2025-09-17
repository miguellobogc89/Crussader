"use client";

import { useState, type ReactNode } from "react";
import { X, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";

type Props = {
  children: ReactNode;

  /** Opcional: cabecera de la card */
  title?: ReactNode;
  description?: ReactNode;

  /** Alto del área de contenido (donde va el gráfico). Por defecto 320px */
  height?: number | string;

  /** Estado inicial del favorito */
  defaultFavorite?: boolean;

  /** Callbacks */
  onFavoriteChange?: (isFav: boolean) => void;
  onRemove?: () => void;

  /** Clases extra */
  className?: string;
  contentClassName?: string;
};

export default function ChartCard({
  children,
  title,
  description,
  height = 320,
  defaultFavorite = false,
  onFavoriteChange,
  onRemove,
  className,
  contentClassName,
}: Props) {
  const [fav, setFav] = useState(defaultFavorite);

  const toggleFav = () => {
    const next = !fav;
    setFav(next);
    onFavoriteChange?.(next);
  };

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      {/* Botones arriba a la izquierda */}
      <div className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-md border bg-white/85 px-1.5 py-1 shadow-sm backdrop-blur">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onRemove}
          aria-label="Quitar panel"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "h-7 w-7 transition-colors",
            fav ? "bg-pink-100 text-pink-600 hover:bg-pink-100" : "text-muted-foreground"
          )}
          onClick={toggleFav}
          aria-pressed={fav}
          aria-label={fav ? "Quitar de favoritos" : "Añadir a favoritos"}
        >
          <Heart className="h-4 w-4" />
        </Button>
      </div>

      {/* Header opcional */}
      {(title || description) && (
        <CardHeader className="pb-2">
          {title ? <CardTitle className="text-base">{title}</CardTitle> : null}
          {description ? (
            <CardDescription className="text-xs">{description}</CardDescription>
          ) : null}
        </CardHeader>
      )}

      {/* Contenido (gráfico) */}
      <CardContent
        className={cn(
          "w-full min-w-0",
          // si hay header dejamos padding normal; si no, damos un poco más de top para no chocar con los botones
          !title && !description ? "pt-8" : "",
          contentClassName
        )}
        style={{ height }}
      >
        {children}
      </CardContent>
    </Card>
  );
}
