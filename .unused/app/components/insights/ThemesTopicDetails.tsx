// app/components/insights/ThemesTopicDetails.tsx
"use client";

import { useMemo } from "react";
import { Badge } from "@/app/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/app/components/ui/accordion";
import type { StarHist, ThemeItem } from "./ThemesSummary";

/** ===== Copiamos la misma normalización/heurística que usa ThemesSummary ===== */
const deaccent = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const normalize = (t: string) => {
  const s = deaccent(String(t || "").toLowerCase()).replace(/\s+/g, " ").trim();
  return s
    .replace(/\bwas+ap+p?\b/g, "whatsapp")
    .replace(/\bwasap\b/g, "whatsapp")
    .replace(/\bwhats app\b/g, "whatsapp")
    .replace(/\b24 ?h\b/g, "24h")
    .replace(/\bdia siguiente\b/g, "24h");
};
const STOP_ADJ = new Set([
  "buen", "buena", "buenas", "bueno", "buenos", "gran", "grande",
  "excelente", "exquisito", "perfecto", "perfecta", "top",
]);
const smartTopicKey = (item: ThemeItem): string => {
  const base = normalize(item.topic || item.term || "") + " " + normalize((item.examples || []).slice(0, 5).join(" "));
  if (/\bwhatsapp\b/.test(base) && /\bseguim/i.test(base)) return "Seguimiento por WhatsApp";
  if (/\bwhatsapp\b/.test(base)) return "Comunicación por WhatsApp";
  if (/\bseguro(s)?\b/.test(base) && /\bcoordinaci/i.test(base)) return "Coordinación con el seguro";
  if (/\bseguro(s)?\b/.test(base)) return "Gestión de seguros";
  if (/resultados?\b/.test(base) && /\b(24h|24 h|en 24h|al dia siguiente)\b/.test(base)) return "Resultados rápidos (24h)";
  if (/resultados?\b/.test(base)) return "Resultados y pruebas";
  if (/\btrato\b/.test(base) || /\batencion\b/.test(base)) return "Trato y atención";
  const termNorm = normalize(item.term);
  if (STOP_ADJ.has(termNorm)) {
    const m = base.match(/\b(buen[aos]?|gran|excelente|perfect[oa])\s+([a-záéíóúñ]+)\b/);
    if (m) return (m[2] === "atencion" || m[2] === "trato") ? "Trato y atención" : m[2];
    return "Experiencia general";
  }
  const bigram = base.match(/\b([a-zñ]+)\s+([a-zñ]+)\b/);
  if (bigram && !STOP_ADJ.has(bigram[1])) {
    const bg = `${bigram[1]} ${bigram[2]}`;
    return bg.replace(/\b\w/g, c => c.toUpperCase());
  }
  const candidate = (item.topic || item.term || "Tema").trim();
  return candidate.charAt(0).toUpperCase() + candidate.slice(1);
};

/** ===== Types ===== */
type GroupedTopic = {
  topic: string;
  topTerm: string | null;
  kind: string;
  docs: number;
  occ: number;
  pos: number; neg: number; neu: number;
  hist: StarHist;
  avg: number;
  examples: string[];
  lastSeenAt?: string | null;
};

export default function ThemesTopicDetails({
  grouped,
  items,
}: {
  grouped: GroupedTopic[];
  items: ThemeItem[];
}) {
  /** Mapa de filas por topic usando LA MISMA clave smartTopicKey */
  const rowsByTopic = useMemo(() => {
    const map = new Map<string, Array<{ term: string; example: string }>>();
    for (const it of items) {
      const topicKey = smartTopicKey(it); // 👈 clave idéntica a la del summary
      if (Array.isArray(it.examples) && it.examples.length) {
        const arr = map.get(topicKey) ?? [];
        for (const ex of it.examples) {
          arr.push({ term: it.term, example: ex });
        }
        map.set(topicKey, arr);
      } else {
        const arr = map.get(topicKey) ?? [];
        map.set(topicKey, arr);
      }
    }
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => a.term.localeCompare(b.term));
      map.set(k, arr);
    }
    return map;
  }, [items]);

  const histSummary = (h: StarHist) => {
    const t = h?.total ?? 0;
    if (!t) return "—";
    const p = (v: number) => Math.round(((v ?? 0) / t) * 100);
    return `${p(h.r1)}%·${p(h.r2)}%·${p(h.r3)}%·${p(h.r4)}%·${p(h.r5)}%`;
  };

  return (
    <div className="mt-2">
      <Accordion type="multiple" className="w-full">
        {grouped.map((g) => {
          const rows = rowsByTopic.get(g.topic) ?? [];
          const termCounts = rows.reduce<Record<string, number>>((acc, r) => {
            acc[r.term] = (acc[r.term] ?? 0) + 1;
            return acc;
          }, {});
          const termCountEntries = Object.entries(termCounts).sort((a, b) => b[1] - a[1]);

          return (
            <AccordionItem key={g.topic} value={g.topic}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex w-full flex-col gap-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{g.topic}</span>
                    <Badge variant="secondary" className="rounded-full">{g.kind}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Docs: <b className="tabular-nums">{g.docs}</b> · Ocurrencias: <b className="tabular-nums">{g.occ}</b> ·{" "}
                    Media: <b className="tabular-nums">{g.avg.toFixed(2)}★</b> · Dist: {histSummary(g.hist)}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {termCountEntries.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {termCountEntries.map(([term, c]) => (
                      <Badge key={term} variant="outline" className="rounded-full">
                        {term} <span className="ml-1 opacity-70">×{c}</span>
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="py-2 pr-3 w-48">Término</th>
                        <th className="py-2 pr-3">Ejemplo / Ocurrencia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length > 0 ? (
                        rows.map((r, idx) => (
                          <tr key={`${g.topic}-${idx}`} className="border-b last:border-0 align-top">
                            <td className="py-2 pr-3">{r.term}</td>
                            <td className="py-2 pr-3">{r.example ? r.example : <span className="text-muted-foreground">—</span>}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={2} className="py-3 text-muted-foreground">No hay ejemplos disponibles para este tema.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
