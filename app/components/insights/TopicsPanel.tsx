// app/components/insights/TopicsPanel.tsx
"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";

export type TopicRow = {
  id: string;
  label: string;
  description?: string | null;
  model?: string | null;
  concept_count?: number | null;
  avg_rating?: number | null;
  is_stable?: boolean | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
};

function fmtPct(n: number): string {
  // si avg_rating está en 0..5, lo dejamos como 0.0–5.0 (no %)
  return n.toFixed(1);
}

export default function TopicsPanel({
  title = "Topics",
  subtitle = "Temas detectados a partir de tus reseñas y concepts.",
  topics,
  emptyLabel = "Aún no hay topics para esta ubicación.",
}: {
  title?: string;
  subtitle?: string;
  topics: TopicRow[];
  emptyLabel?: string;
}) {
  const count = topics.length;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
            <CardDescription className="text-xs sm:text-sm">{subtitle}</CardDescription>
          </div>

          <Badge variant="secondary" className="shrink-0">
            {count} {count === 1 ? "topic" : "topics"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {count === 0 ? (
          <div className="rounded-lg border bg-slate-50 px-4 py-6 text-sm text-slate-600">
            {emptyLabel}
          </div>
        ) : (
          <div className="space-y-3">
            {topics.map((t) => {
              const concepts = t.concept_count ?? 0;
              const rating = typeof t.avg_rating === "number" ? fmtPct(t.avg_rating) : null;
              const stable = t.is_stable === true;

              return (
                <div
                  key={t.id}
                  className="rounded-xl border bg-white px-4 py-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="truncate font-semibold text-slate-900">
                          {t.label}
                        </div>
                        {stable ? (
                          <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                            estable
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-600">
                            en revisión
                          </Badge>
                        )}
                      </div>

                      {t.description ? (
                        <div className="mt-1 line-clamp-2 text-sm text-slate-600">
                          {t.description}
                        </div>
                      ) : null}
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="text-xs text-slate-500">Concepts</div>
                      <div className="font-semibold text-slate-900">{concepts}</div>
                      <Separator className="my-2" />
                      <div className="text-xs text-slate-500">Score</div>
                      <div className="font-semibold text-slate-900">
                        {rating ? rating : "—"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {t.model ? (
                      <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                        {t.model}
                      </Badge>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
