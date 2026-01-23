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

type JudgmentSample = {
  judgment: string | null;
  intensity: number | null;
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const locationId = url.searchParams.get("locationId");

    if (!locationId) {
      return NextResponse.json(
        { ok: false, error: "Missing query param: locationId" },
        { status: 400 }
      );
    }

    const limit = clampInt(url.searchParams.get("limit"), 30, 5, 100);
    const samplesLimit = clampInt(url.searchParams.get("samples"), 3, 1, 5);

    /**
     * 1) Cargamos concepts con sus normalizaciones
     *    NOTA: judgment/intensity vienen en `structured`
     */
    const concepts = await prisma.concept.findMany({
      where: {
        location_id: locationId,
      },
      select: {
        id: true,
        structured: true,
        concept_normalized_entity: {
          where: { status: "active" },
          select: {
            normalized_entity: {
              select: {
                id: true,
                display_name: true,
                canonical_key: true,
              },
            },
          },
        },
        concept_normalized_aspect: {
          where: { status: "active" },
          select: {
            normalized_aspect: {
              select: {
                id: true,
                display_name: true,
                canonical_key: true,
              },
            },
          },
        },
      },
    });

    /**
     * 2) Expandimos a pares (entity × aspect)
     */
    const pairMap = new Map<
      string,
      {
        entity: {
          id: string;
          display_name: string;
          canonical_key: string;
        };
        aspect: {
          id: string;
          display_name: string;
          canonical_key: string;
        };
        count: number;
        samples: JudgmentSample[];
      }
    >();

    for (const c of concepts) {
      const structured = c.structured as any | null;

      const judgment =
        structured && typeof structured.judgment === "string"
          ? structured.judgment
          : null;

      const intensity =
        structured && typeof structured.intensity === "number"
          ? structured.intensity
          : null;

      for (const e of c.concept_normalized_entity) {
        for (const a of c.concept_normalized_aspect) {
          const key = `${e.normalized_entity.id}::${a.normalized_aspect.id}`;
          const existing = pairMap.get(key);

          if (!existing) {
            pairMap.set(key, {
              entity: e.normalized_entity,
              aspect: a.normalized_aspect,
              count: 1,
              samples: [{ judgment, intensity }],
            });
          } else {
            existing.count += 1;
            if (existing.samples.length < samplesLimit) {
              existing.samples.push({ judgment, intensity });
            }
          }
        }
      }
    }

    /**
     * 3) Ordenamos y limitamos
     */
    const pairs = Array.from(pairMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return NextResponse.json({
      ok: true,
      locationId,
      pairs,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
