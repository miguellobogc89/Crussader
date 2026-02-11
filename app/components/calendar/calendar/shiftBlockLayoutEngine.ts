// app/components/calendar/calendar/shiftBlockLayoutEngine.ts

export type LayoutBlock = {
  key: string; // id estable del bloque (rolKey, employeeId, etc.)
  startMin: number; // minutos desde medianoche (clamp hecho fuera)
  endMin: number;
  name: string; // título visible (rol / empleado)
  color: string | null;
  lines: string[]; // popover lines
};

export type LayoutSegment = {
  startMin: number;
  endMin: number;
  columns: Array<{
    key: string;
    name: string;
    color: string | null;
    lines: string[];
    leftPct: number;
    widthPct: number;
  }>;
};

function clamp(n: number, min: number, max: number) {
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

function signatureFromColumns(cols: LayoutSegment["columns"]) {
  // Orden estable por key; signature incluye contenido para poder mergear sin duplicar
  const keys = cols.map((c) => c.key).sort((a, b) => a.localeCompare(b, "es"));
  let sig = keys.join("|");
  for (const k of keys) {
    const c = cols.find((x) => x.key === k);
    if (!c) continue;
    sig += `#${k}:${c.name}:${String(c.color ?? "")}:${(c.lines || []).join(",")}`;
  }
  return sig;
}

export function computeSegmentsFromBlocks(
  inputBlocks: LayoutBlock[],
  opts?: {
    maxColumns?: number; // si quieres colapsar (por ahora lo dejamos sin colapso)
    clampMin?: number; // start visible
    clampMax?: number; // end visible
    mergeAdjacent?: boolean; // default true
  }
): LayoutSegment[] {
  const maxColumns = typeof opts?.maxColumns === "number" ? opts!.maxColumns : Infinity;
  const mergeAdjacent = opts?.mergeAdjacent !== false;

  // normaliza y filtra
  const blocks: LayoutBlock[] = [];
  for (const b of inputBlocks) {
    if (!b) continue;

    let s = Number(b.startMin);
    let e = Number(b.endMin);
    if (!Number.isFinite(s) || !Number.isFinite(e)) continue;

    if (typeof opts?.clampMin === "number") s = clamp(s, opts.clampMin, Number.MAX_SAFE_INTEGER);
    if (typeof opts?.clampMax === "number") e = clamp(e, Number.MIN_SAFE_INTEGER, opts.clampMax);

    if (e <= s) continue;

    blocks.push({
      key: String(b.key),
      startMin: s,
      endMin: e,
      name: String(b.name),
      color: b.color ? String(b.color) : null,
      lines: Array.isArray(b.lines) ? b.lines.map((x) => String(x)) : [],
    });
  }

  if (blocks.length === 0) return [];

  // cuts
  const cuts = new Set<number>();
  for (const b of blocks) {
    cuts.add(b.startMin);
    cuts.add(b.endMin);
  }
  const times = Array.from(cuts).sort((a, b) => a - b);
  if (times.length < 2) return [];

  const segments: LayoutSegment[] = [];

  for (let i = 0; i < times.length - 1; i += 1) {
    const segStart = times[i];
    const segEnd = times[i + 1];
    if (segEnd <= segStart) continue;

    // activos en el tramo
    const active = blocks.filter((b) => b.startMin < segEnd && b.endMin > segStart);

    // dedupe por key (mergea lines)
    const byKey = new Map<string, LayoutBlock>();
    for (const b of active) {
      const existing = byKey.get(b.key);
      if (!existing) {
        byKey.set(b.key, { ...b, lines: [...b.lines] });
        continue;
      }

      // name/color: mantenemos el primero; lines: unión sin duplicados
      const set = new Set<string>(existing.lines);
      for (const t of b.lines) set.add(t);
      existing.lines = Array.from(set);
    }

    let cols = Array.from(byKey.values());

    // orden estable por name (y key fallback)
    cols.sort((a, b) => {
      const n = a.name.localeCompare(b.name, "es");
      if (n !== 0) return n;
      return a.key.localeCompare(b.key, "es");
    });

    // (opcional) max columns -> por ahora truncamos visualmente si quieres
    if (cols.length > maxColumns) cols = cols.slice(0, maxColumns);

    const widthPct = 100 / cols.length;

    const columns = cols.map((c, idx) => ({
      key: c.key,
      name: c.name,
      color: c.color,
      lines: c.lines,
      leftPct: idx * widthPct,
      widthPct,
    }));

    segments.push({ startMin: segStart, endMin: segEnd, columns });
  }

  if (!mergeAdjacent || segments.length === 0) return segments;

  // merge tramos contiguos con mismo set de columnas
  const merged: LayoutSegment[] = [];
  let prev = segments[0];
  let prevSig = signatureFromColumns(prev.columns);

  for (let i = 1; i < segments.length; i += 1) {
    const cur = segments[i];

    if (cur.startMin !== prev.endMin) {
      merged.push(prev);
      prev = cur;
      prevSig = signatureFromColumns(prev.columns);
      continue;
    }

    const curSig = signatureFromColumns(cur.columns);
    if (curSig === prevSig) {
      prev = { startMin: prev.startMin, endMin: cur.endMin, columns: prev.columns };
      continue;
    }

    merged.push(prev);
    prev = cur;
    prevSig = curSig;
  }

  merged.push(prev);
  return merged;
}
