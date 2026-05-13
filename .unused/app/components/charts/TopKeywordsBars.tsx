"use client";

type Sentiment = "positive" | "negative" | "neutral";

export type TopKeywordsRow = {
  word: string;
  count: number;
  sentiment?: Sentiment; // opcional (default: neutral)
};

export type TopKeywordsBarsProps = {
  data: TopKeywordsRow[];
  /** máx. items a mostrar (0 = todos) */
  limit?: number;
  /** orden por: "count" | "word" */
  sortBy?: "count" | "word";
  /** descendente (cuando sortBy="count" suele ser true) */
  desc?: boolean;
  /** alto de cada barra */
  barHeight?: number; // default 12
  /** colores (fallback CSS) */
  trackColor?: string;          // fondo gris (default neutral-200)
  positiveColor?: string;       // verde
  negativeColor?: string;       // rojo
  neutralColor?: string;        // gris
  /** mostrar valor a la derecha */
  showRightCount?: boolean;     // default true
  /** ancho fijo de columna de palabra (px) */
  labelWidth?: number;          // default 100
  /** ancho fijo de columna de stats derecha (px) */
  rightWidth?: number;          // default 64
};

export function TopKeywordsBars({
  data,
  limit = 0,
  sortBy = "count",
  desc = true,
  barHeight = 14,
  trackColor = "#e5e7eb", // neutral-200
  positiveColor = "hsl(var(--success))",
  negativeColor = "hsl(var(--destructive))",
  neutralColor = "hsl(var(--muted-foreground))",
  showRightCount = true,
  labelWidth = 60,
  rightWidth = 64,
}: TopKeywordsBarsProps) {
  const sorted = [...data].sort((a, b) => {
    if (sortBy === "count") return desc ? b.count - a.count : a.count - b.count;
    return desc ? b.word.localeCompare(a.word) : a.word.localeCompare(b.word);
  });
  const rows = limit > 0 ? sorted.slice(0, limit) : sorted;
  const max = rows.reduce((m, r) => Math.max(m, r.count), 0) || 1;

  const fillFor = (s?: Sentiment) =>
    s === "positive" ? positiveColor : s === "negative" ? negativeColor : neutralColor;

  return (
    <div className="space-y-3">
      {rows.map((r, i) => {
        const pct = Math.max(4, Math.round((r.count / max) * 100)); // min 4% visible
        const template = showRightCount
          ? `${labelWidth}px 1fr ${rightWidth}px`
          : `${labelWidth}px 1fr`;
        return (
          <div
            key={`${r.word}-${i}`}
            className="grid items-center gap-3"
            style={{ gridTemplateColumns: template }}
          >
            {/* Col 1: palabra (ancho fijo) */}
            <span className="truncate text-sm font-medium" title={r.word}>
              {r.word}
            </span>

            {/* Col 2: barra (mismo ancho en todas las filas) */}
            <div
              className="relative min-w-0 overflow-hidden rounded-full"
              style={{ height: barHeight, backgroundColor: trackColor }}
              aria-label={`${r.word} ${pct}%`}
              role="img"
            >
              <div
                className="h-full transition-[width] duration-500"
                style={{ width: `${pct}%`, backgroundColor: fillFor(r.sentiment) }}
              />
            </div>

            {/* Col 3: stats (ancho fijo) */}
            {showRightCount && (
              <span className="text-right text-sm font-medium text-muted-foreground">{r.count}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
