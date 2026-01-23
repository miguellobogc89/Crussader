// app/api/reviews/insights/highlights/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/server/db";

function clampInt(v: string | null, def: number, min: number, max: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  const i = Math.floor(n);
  if (i < min) return min;
  if (i > max) return max;
  return i;
}

type AggRow = {
  label: string;
  pos: number;
  neg: number;
  neu: number;
};

type TagRow = { label: string; mentions: number };

function pickBlock(row: AggRow): { block: "success" | "attention" | "improve"; mentions: number } | null {
  const pos = Number(row.pos) || 0;
  const neg = Number(row.neg) || 0;
  const neu = Number(row.neu) || 0;

  if (pos > neg) {
    return { block: "success", mentions: pos - neg };
  }
  if (neg > pos) {
    return { block: "attention", mentions: neg - pos };
  }

  // empate: neutral decide. si neutral no existe, al menos mostramos algo (pos==neg)
  const m = neu > 0 ? neu : pos;
  if (m <= 0) return null;
  return { block: "improve", mentions: m };
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const locationId = url.searchParams.get("locationId");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const limit = clampInt(url.searchParams.get("limit"), 5, 1, 20);

    if (!locationId) {
      return NextResponse.json({ ok: false, error: "locationId requerido" }, { status: 400 });
    }
    if (!from || !to) {
      return NextResponse.json({ ok: false, error: "from/to requeridos" }, { status: 400 });
    }

    // ===== 1) SUCCESS (5★) neteado por aspecto
    const successAgg = await prisma.$queryRaw<AggRow[]>`
      SELECT
        na.display_name AS label,
        SUM(CASE WHEN c.sentiment = 'positive' THEN 1 ELSE 0 END)::int AS pos,
        SUM(CASE WHEN c.sentiment = 'negative' THEN 1 ELSE 0 END)::int AS neg,
        SUM(CASE WHEN c.sentiment = 'neutral'  THEN 1 ELSE 0 END)::int AS neu
      FROM concept c
      JOIN normalized_aspect na ON na.id = c.normalized_aspect_id
      WHERE c.location_id = ${locationId}
        AND COALESCE(c.review_published_at, c.review_date, c.created_at) >= ${from}::date
        AND COALESCE(c.review_published_at, c.review_date, c.created_at) < ${to}::date
        AND c.normalized_aspect_id IS NOT NULL
        AND na.is_active = true
        AND c.rating = 5
      GROUP BY na.display_name
      ORDER BY (SUM(CASE WHEN c.sentiment='positive' THEN 1 ELSE 0 END)
              - SUM(CASE WHEN c.sentiment='negative' THEN 1 ELSE 0 END)) DESC,
               na.display_name ASC
      LIMIT ${Math.max(200, limit * 30)};
    `;

    const success: TagRow[] = [];
    const usedLabels = new Set<string>();

    for (const r of successAgg) {
      const picked = pickBlock(r);
      if (!picked) continue;
      // En success solo aceptamos los que ganan en positivo
      if (picked.block !== "success") continue;

      const label = String(r.label);
      if (usedLabels.has(label)) continue;

      usedLabels.add(label);
      success.push({ label, mentions: picked.mentions });
      if (success.length >= limit) break;
    }

    // ===== 2) IMPROVE/ATTENTION (3–4★ y 1–2★) neteado y sin duplicar labels ya usadas
    const otherAgg = await prisma.$queryRaw<Array<AggRow & { band: string }>>`
      SELECT
        na.display_name AS label,
        CASE
          WHEN c.rating BETWEEN 3 AND 4 THEN 'mid'
          WHEN c.rating BETWEEN 1 AND 2 THEN 'low'
          ELSE 'other'
        END AS band,
        SUM(CASE WHEN c.sentiment = 'positive' THEN 1 ELSE 0 END)::int AS pos,
        SUM(CASE WHEN c.sentiment = 'negative' THEN 1 ELSE 0 END)::int AS neg,
        SUM(CASE WHEN c.sentiment = 'neutral'  THEN 1 ELSE 0 END)::int AS neu
      FROM concept c
      JOIN normalized_aspect na ON na.id = c.normalized_aspect_id
      WHERE c.location_id = ${locationId}
        AND COALESCE(c.review_published_at, c.review_date, c.created_at) >= ${from}::date
        AND COALESCE(c.review_published_at, c.review_date, c.created_at) < ${to}::date
        AND c.normalized_aspect_id IS NOT NULL
        AND na.is_active = true
        AND c.rating BETWEEN 1 AND 4
      GROUP BY na.display_name, band
      ORDER BY na.display_name ASC
      LIMIT ${Math.max(400, limit * 60)};
    `;

    const improve: TagRow[] = [];
    const attention: TagRow[] = [];

    // Primero “low” (1–2★) para llenar Atención, luego “mid” (3–4★) para Mejorar.
    // Dentro de cada uno, neteo: pos-neg decide bloque; empate => improve.
    const low = otherAgg.filter((x) => x.band === "low");
    const mid = otherAgg.filter((x) => x.band === "mid");

    // Atención: solo los que ganan en negativo (y no estén ya usados)
    low
      .map((r) => ({ r, picked: pickBlock(r) }))
      .filter((x) => x.picked && x.picked.block === "attention")
      .sort((a, b) => (b.picked!.mentions - a.picked!.mentions) || String(a.r.label).localeCompare(String(b.r.label)))
      .forEach((x) => {
        if (attention.length >= limit) return;
        const label = String(x.r.label);
        if (usedLabels.has(label)) return;
        usedLabels.add(label);
        attention.push({ label, mentions: x.picked!.mentions });
      });

    // Mejorar: del band mid, los que NO ganan en positivo (evitamos “éxito” disfrazado)
    mid
      .map((r) => ({ r, picked: pickBlock(r) }))
      .filter((x) => x.picked && x.picked.block !== "success")
      .sort((a, b) => (b.picked!.mentions - a.picked!.mentions) || String(a.r.label).localeCompare(String(b.r.label)))
      .forEach((x) => {
        if (improve.length >= limit) return;
        const label = String(x.r.label);
        if (usedLabels.has(label)) return;
        usedLabels.add(label);
        improve.push({ label, mentions: x.picked!.mentions });
      });


      
    // ===== 3) Relleno marketing de "improve" desde "success" si improve está vacío (o corto)
    // Regla: solo robamos de success si improve < 2 (porque tus reglas acaban en improve=2 máx para el caso de 5)
    function clamp(n: number, min: number, max: number) {
    if (n < min) return min;
    if (n > max) return max;
    return n;
    }

    function fillImproveFromSuccess(args: { success: TagRow[]; improve: TagRow[] }) {
    const s = args.success;
    const m = args.improve;

    const sCount = s.length;
    const mCount = m.length;

    // target (success, improve) según tus reglas
    let targetSuccess = sCount;
    let targetImprove = mCount;

    if (sCount >= 5) {
        if (mCount === 0) {
        targetSuccess = 3;
        targetImprove = 2;
        } else if (mCount === 1) {
        targetSuccess = 4;
        targetImprove = 2;
        } else {
        return; // mCount >= 2 => no hacemos nada
        }
    } else if (sCount === 4) {
        if (mCount === 0) {
        targetSuccess = 3;
        targetImprove = 1;
        } else {
        return; // mCount >= 1 => no hacemos nada
        }
    } else if (sCount === 3) {
        if (mCount === 0) {
        targetSuccess = 2;
        targetImprove = 1;
        } else {
        return; // mCount >= 1 => no hacemos nada
        }
    } else {
        return; // con 0..2 success no tocamos nada
    }

    // Calculamos cuánto robar de success para llegar a targetImprove sin exceder
    const needed = targetImprove - mCount;
    if (needed <= 0) return;

    // success se ordena desc por mentions; “peores” están al final
    // Robamos del final y los movemos a improve
    const maxSteal = clamp(sCount - targetSuccess, 0, needed);
    if (maxSteal <= 0) return;

    const stolen = s.splice(s.length - maxSteal, maxSteal);
    // añade al final de improve
    for (const item of stolen) {
        m.push(item);
    }
    }

    fillImproveFromSuccess({ success, improve });

    // Garantía final: máx 5 por bloque
    success.splice(5);
    improve.splice(5);
    attention.splice(5);






    return NextResponse.json({ ok: true, success, improve, attention });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
