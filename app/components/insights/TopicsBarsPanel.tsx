"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";
import { Button } from "@/app/components/ui/button";
import {
  Sparkles,
  MessageSquareText,
  Layers3,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";

export type TopicBarRow = {
  id: string;
  label: string;
  description?: string | null;
  concept_count?: number | null;
  avg_rating?: number | null;
  is_stable?: boolean | null;
  model?: string | null;
};

function safeNum(n: unknown): number {
  if (typeof n === "number" && Number.isFinite(n)) return n;
  return 0;
}

function getBarGradient(index: number): string {
  if (index === 0) return "from-violet-600 to-fuchsia-500";
  if (index === 1) return "from-sky-600 to-cyan-500";
  if (index === 2) return "from-emerald-600 to-lime-500";
  if (index === 3) return "from-amber-600 to-orange-500";
  return "from-rose-600 to-pink-500";
}

function getIcon(index: number) {
  if (index === 0) return Sparkles;
  if (index === 1) return MessageSquareText;
  if (index === 2) return Layers3;
  return Sparkles;
}

export default function TopicsBarsPanel({
  title = "Top topics",
  subtitle = "Pulsa una barra para ver el detalle.",
  topics,
  topN = 5,
  emptyLabel,
}: {
  title?: string;
  subtitle?: string;
  topics: TopicBarRow[];
  topN?: number;
  emptyLabel?: string;
}) {
  const rows = React.useMemo(() => {
    const copy = [...topics];
    copy.sort((a, b) => safeNum(b.concept_count) - safeNum(a.concept_count));
    return copy.slice(0, topN);
  }, [topics, topN]);

  const maxVolume = React.useMemo(() => {
    let m = 0;
    for (const r of rows) m = Math.max(m, safeNum(r.concept_count));
    return m;
  }, [rows]);

  const [activeId, setActiveId] = React.useState<string | null>(
    rows[0]?.id ?? null
  );

  React.useEffect(() => {
    setActiveId(rows[0]?.id ?? null);
  }, [rows.length]);

  const active = rows.find((r) => r.id === activeId) ?? null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {subtitle}
            </CardDescription>
          </div>
          <Badge variant="secondary">{rows.length}</Badge>
        </div>
      </CardHeader>

      <CardContent>
        {rows.length === 0 ? (
          <div className="rounded-lg border bg-slate-50 px-4 py-6 text-sm text-slate-600">
            {emptyLabel}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* BARRAS */}
            <div className="lg:col-span-2 space-y-3">
              {rows.map((t, i) => {
                const vol = safeNum(t.concept_count);
                const width =
                  maxVolume > 0 ? Math.max(8, (vol / maxVolume) * 100) : 8;
                const Icon = getIcon(i);
                const selected = activeId === t.id;

                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveId(t.id)}
                    className={[
                      "w-full rounded-xl border px-3 py-3 text-left transition",
                      selected
                        ? "bg-slate-50 border-slate-300"
                        : "bg-white hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="rounded-lg border bg-white p-2">
                          <Icon className="h-4 w-4 text-slate-700" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-semibold">
                            {i + 1}. {t.label}
                          </div>
                          <div className="text-xs text-slate-500">
                            Volumen {vol}
                            {typeof t.avg_rating === "number"
                              ? ` · Score ${t.avg_rating.toFixed(1)}`
                              : ""}
                          </div>
                        </div>
                      </div>

                      {t.is_stable ? (
                        <Badge className="bg-emerald-600 text-white">
                          estable
                        </Badge>
                      ) : (
                        <Badge variant="outline">en revisión</Badge>
                      )}
                    </div>

                    <div className="mt-3 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${getBarGradient(
                          i
                        )}`}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* DETALLE */}
            <div className="rounded-xl border bg-white p-4">
              {active ? (
                <>
                  <div className="flex items-start justify-between">
                    <div className="font-semibold truncate">
                      {active.label}
                    </div>
                    {active.is_stable ? (
                      <div className="flex items-center gap-1 text-emerald-700 text-xs">
                        <ShieldCheck className="h-4 w-4" />
                        Estable
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-amber-700 text-xs">
                        <ShieldAlert className="h-4 w-4" />
                        En revisión
                      </div>
                    )}
                  </div>

                  <Separator className="my-3" />

                  <p className="text-sm text-slate-600">
                    {active.description ?? "Sin descripción."}
                  </p>

                  <Separator className="my-3" />

                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Volumen</span>
                      <span className="font-semibold">
                        {active.concept_count ?? 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Score</span>
                      <span className="font-semibold">
                        {typeof active.avg_rating === "number"
                          ? active.avg_rating.toFixed(1)
                          : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3">
                    <Button variant="outline" className="w-full">
                      Ver concepts del topic
                    </Button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
