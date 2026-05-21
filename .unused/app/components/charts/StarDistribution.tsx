"use client";

type Item = {
  label: string;        // ej: "5⭐"
  count?: number;       // opcional
  percentage?: number;  // opcional (0-100). Si no viene, se calcula con count
};

export type StarDistributionProps = {
  data: Item[];
  /** alto de la barra en px */
  barHeight?: number; // default 16
  /** clases Tailwind para el track (fondo) y el fill (relleno) */
  trackClassName?: string; // default "bg-muted" (gris)
  fillClassName?: string;  // default "bg-warning" (amarillo)
  /** fallback CSS color si las clases no existen o están purgadas */
  trackColor?: string;     // default "hsl(var(--muted))"
  fillColor?: string;      // default "hsl(var(--warning))"
  showRightStats?: boolean; // default true
};

export function StarDistribution({
  data,
  barHeight = 16,
  trackClassName = "bg-muted",
  fillClassName = "bg-warning",
  trackColor = "hsl(var(--muted))",
  fillColor = "hsl(var(--warning))",
  showRightStats = true,
}: StarDistributionProps) {
  const total = data.reduce((acc, d) => acc + (d.count ?? 0), 0);

  const getPct = (d: Item) => {
    if (typeof d.percentage === "number") return Math.max(0, Math.min(100, d.percentage));
    if (!total) return 0;
    return Math.round(((d.count ?? 0) / total) * 100);
  };

  return (
    <div className="space-y-4">
      {data.map((d, idx) => {
        const pct = getPct(d);
        return (
          <div key={`${d.label}-${idx}`} className="flex items-center justify-between gap-4">
            {/* etiqueta + barra */}
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="w-10 shrink-0 text-sm font-medium">{d.label}</span>

              <div
                className={`relative w-full overflow-hidden rounded-full ${trackClassName}`}
                style={{ height: barHeight, backgroundColor: trackColor }}
                aria-label={`${d.label} ${pct}%`}
                role="img"
              >
                <div
                  className={`h-full ${fillClassName} transition-[width] duration-500`}
                  style={{ width: `${pct}%`, backgroundColor: fillColor }}
                />
              </div>
            </div>

            {showRightStats && (
              <div className="text-right">
                {typeof d.count === "number" && <p className="text-sm font-medium">{d.count}</p>}
                <p className="text-xs text-muted-foreground">{pct}%</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
