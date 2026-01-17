// app/server/concepts/normalization/entity/dryRunMergeEntities.ts
import { prisma } from "@/app/server/db";
import { openai } from "@/app/server/openaiClient";
import { canonicalizeKey } from "../canonicalizeKey";

const MODEL = "gpt-4o-mini";

export type MergeEntityCluster = {
  winner: {
    id: string;
    display_name: string;
    canonical_key: string;
    usage_count: number;
    created_at: Date;
  };
  losers: Array<{
    id: string;
    display_name: string;
    canonical_key: string;
    usage_count: number;
    created_at: Date;
    confidence: number;
    reason: string;
  }>;
};

type Row = {
  id: string;
  display_name: string;
  canonical_key: string;
  usage_count: number;
  created_at: Date;
};

type PairDecision = {
  a: string;
  b: string;
  same: boolean;
  confidence: number;
  reason: string;
};

function tokensFromCanonicalKey(key: string): string[] {
  return String(key ?? "")
    .split("_")
    .map((x) => x.trim())
    .filter(Boolean);
}

function jaccard(a: string[], b: string[]): number {
  const A = new Set(a);
  const B = new Set(b);
  let inter = 0;
  for (const x of A) {
    if (B.has(x)) inter += 1;
  }
  const union = A.size + B.size - inter;
  if (union <= 0) return 0;
  return inter / union;
}

// Bigrams dice coefficient (rápido, sin dependencias)
function diceBigrams(a: string, b: string): number {
  const s1 = String(a ?? "");
  const s2 = String(b ?? "");
  if (!s1 || !s2) return 0;

  const bigrams = (s: string) => {
    const out: string[] = [];
    for (let i = 0; i < s.length - 1; i += 1) out.push(s.slice(i, i + 2));
    return out;
  };

  const A = bigrams(s1);
  const B = bigrams(s2);
  if (A.length === 0 || B.length === 0) return 0;

  const counts = new Map<string, number>();
  for (const x of A) counts.set(x, (counts.get(x) ?? 0) + 1);

  let inter = 0;
  for (const x of B) {
    const n = counts.get(x) ?? 0;
    if (n > 0) {
      inter += 1;
      counts.set(x, n - 1);
    }
  }

  return (2 * inter) / (A.length + B.length);
}

function isPotentialDuplicate(
  w: { canonical_key: string; display_name: string },
  l: { canonical_key: string; display_name: string },
): boolean {
  const wk = w.canonical_key;
  const lk = l.canonical_key;

  if (!wk || !lk) return false;
  if (wk === lk) return false;

  // Heurísticas universales SOLO para reducir pares (NO decide merge)
  if (wk.includes(lk) || lk.includes(wk)) return true;

  const wt = tokensFromCanonicalKey(wk);
  const lt = tokensFromCanonicalKey(lk);

  const jac = jaccard(wt, lt);
  if (jac >= 0.6) return true;

  const dice = diceBigrams(wk, lk);
  if (dice >= 0.72) return true;

  if (wt[0] && lt[0] && wt[0] === lt[0] && jac >= 0.35) return true;

  return false;
}

function clamp01(n: unknown, def = 0.8): number {
  const x = Number(n);
  if (!Number.isFinite(x)) return def;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

function pairKey(a: string, b: string): string {
  if (a < b) return `${a}__${b}`;
  return `${b}__${a}`;
}

// Union-Find (DSU)
class DSU {
  parent: Map<string, string>;
  rank: Map<string, number>;

  constructor(ids: string[]) {
    this.parent = new Map();
    this.rank = new Map();
    for (const id of ids) {
      this.parent.set(id, id);
      this.rank.set(id, 0);
    }
  }

  find(x: string): string {
    const p = this.parent.get(x);
    if (!p) return x;
    if (p === x) return x;
    const root = this.find(p);
    this.parent.set(x, root);
    return root;
  }

  union(a: string, b: string) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return;

    const rka = this.rank.get(ra) ?? 0;
    const rkb = this.rank.get(rb) ?? 0;

    if (rka < rkb) {
      this.parent.set(ra, rb);
      return;
    }
    if (rkb < rka) {
      this.parent.set(rb, ra);
      return;
    }

    this.parent.set(rb, ra);
    this.rank.set(ra, rka + 1);
  }
}

function compareWinner(a: Row, b: Row): number {
  // a “mejor” que b => devuelve -1 para que a gane en sort asc
  if (a.usage_count !== b.usage_count) return b.usage_count - a.usage_count; // desc usage
  if (a.created_at.getTime() !== b.created_at.getTime()) return a.created_at.getTime() - b.created_at.getTime(); // asc created
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
}

async function aiCompareWinnerWithLosers(args: {
  winner: { id: string; display_name: string; canonical_key: string };
  losers: Array<{ id: string; display_name: string; canonical_key: string }>;
}): Promise<Array<{ loser_id: string; same: boolean; confidence: number; reason: string }>> {
  const sys = [
    "Eres un sistema de DEDUPLICACION de entidades para analitica de reseñas, universal para cualquier negocio.",
    "Tu tarea: decidir si cada 'loser' es SEMANTICAMENTE la MISMA entidad que el 'winner'.",
    "",
    "Reglas:",
    "- SAME=true solo si es claramente el MISMO objeto referencial (sinonimo o variante trivial).",
    "- Ejemplos: 'dependiente' ~ 'personal' => SAME=true.",
    "- Ejemplos: 'helado chocolate' ~ 'helado de chocolate' => SAME=true.",
    "- Ejemplos: 'helado' ~ 'helado de chocolate' => SAME=false (general vs específico).",
    "- Ejemplos: 'carta de helados' ~ 'helado' => SAME=false (carta vs producto).",
    "- Marcas: 'Frigo' NO es lo mismo que 'helado'.",
    "",
    "Devuelve SOLO JSON como objeto:",
    '{"results":[{"loser_id":"...","same":true|false,"confidence":0..1,"reason":"..."}]}',
    "No incluyas texto fuera del JSON.",
  ].join("\n");

  const user = [
    `WINNER: ${args.winner.display_name} | ${args.winner.canonical_key} | ${args.winner.id}`,
    "",
    "LOSERS:",
    ...args.losers.map((l) => `- ${l.display_name} | ${l.canonical_key} | ${l.id}`),
  ].join("\n");

  const resp = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.1,
    max_tokens: 450,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: sys },
      { role: "user", content: user },
    ],
  });

  const raw = resp.choices?.[0]?.message?.content?.trim() ?? "{}";

  let parsed: unknown = {};
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = {};
  }

  const obj = parsed as { results?: unknown };
  const arr = Array.isArray(obj.results) ? (obj.results as unknown[]) : [];

  return arr
    .map((x) => {
      const item = x as { loser_id?: unknown; same?: unknown; confidence?: unknown; reason?: unknown };
      return {
        loser_id: String(item.loser_id ?? "").trim(),
        same: Boolean(item.same),
        confidence: clamp01(item.confidence, 0.5),
        reason: String(item.reason ?? "").trim().slice(0, 180),
      };
    })
    .filter((x) => x.loser_id.length > 0);
}

export async function dryRunMergeEntities(limitClusters = 50): Promise<MergeEntityCluster[]> {
  const rows = await prisma.normalized_entity.findMany({
    where: { is_active: true },
    select: { id: true, display_name: true, canonical_key: true, usage_count: true, created_at: true },
    orderBy: [{ usage_count: "desc" }, { created_at: "asc" }],
    take: 500,
  });

  if (rows.length < 2) return [];

  // Normaliza canonical_key vacío (por si acaso)
  const normRows: Row[] = rows.map((r) => ({
    id: r.id,
    display_name: r.display_name,
    canonical_key: r.canonical_key || canonicalizeKey(r.display_name),
    usage_count: r.usage_count ?? 0,
    created_at: r.created_at,
  }));

  const byId = new Map<string, Row>();
  for (const r of normRows) byId.set(r.id, r);

  // 1) Construimos edges “same” con heurística + IA, sin generar clusters todavía.
  //    Guardamos evidencia por par para luego rellenar confidence/reason.
  const decisions = new Map<string, { confidence: number; reason: string }>();
  const dsu = new DSU(normRows.map((r) => r.id));

  // Control de coste: pares únicos y máximo losers por winner
  const seenPairs = new Set<string>();

  for (const w of normRows) {
    // candidatos por heurística
    const pot: Row[] = [];
    for (const l of normRows) {
      if (l.id === w.id) continue;
      const pk = pairKey(w.id, l.id);
      if (seenPairs.has(pk)) continue;
      if (!isPotentialDuplicate(w, l)) continue;

      seenPairs.add(pk);
      pot.push(l);

      if (pot.length >= 20) break;
    }

    if (pot.length === 0) continue;

    const ai = await aiCompareWinnerWithLosers({
      winner: { id: w.id, display_name: w.display_name, canonical_key: w.canonical_key },
      losers: pot.map((l) => ({ id: l.id, display_name: l.display_name, canonical_key: l.canonical_key })),
    });

    for (const r of ai) {
      if (!r.same) continue;

      const lId = r.loser_id;
      if (!byId.has(lId)) continue;

      const pk = pairKey(w.id, lId);
      const prev = decisions.get(pk);

      // nos quedamos con la evidencia de mayor confianza
      if (!prev || r.confidence > prev.confidence) {
        decisions.set(pk, { confidence: r.confidence, reason: r.reason || "sinónimo/variante" });
      }

      dsu.union(w.id, lId);
    }
  }

  // 2) Componentes conectados
  const compMap = new Map<string, string[]>();
  for (const r of normRows) {
    const root = dsu.find(r.id);
    const arr = compMap.get(root) ?? [];
    arr.push(r.id);
    compMap.set(root, arr);
  }

  // 3) Por cada componente, elegir winner determinista y emitir UN cluster
  const clusters: MergeEntityCluster[] = [];

  for (const ids of compMap.values()) {
    if (ids.length < 2) continue;

    const members: Row[] = ids
      .map((id) => byId.get(id))
      .filter((x): x is Row => Boolean(x));

    members.sort(compareWinner);
    const winner = members[0];
    const losersRows = members.slice(1);

    const losers = losersRows.map((l) => {
      const pk = pairKey(winner.id, l.id);
      const ev = decisions.get(pk);
      return {
        id: l.id,
        display_name: l.display_name,
        canonical_key: l.canonical_key,
        usage_count: l.usage_count,
        created_at: l.created_at,
        confidence: ev ? ev.confidence : 0.8,
        reason: ev ? ev.reason : "mismo componente (deduplicación)",
      };
    });

    clusters.push({
      winner: {
        id: winner.id,
        display_name: winner.display_name,
        canonical_key: winner.canonical_key,
        usage_count: winner.usage_count,
        created_at: winner.created_at,
      },
      losers,
    });
  }

  // 4) Orden y límite final
  clusters.sort((a, b) => b.losers.length - a.losers.length);
  return clusters.slice(0, limitClusters);
}
